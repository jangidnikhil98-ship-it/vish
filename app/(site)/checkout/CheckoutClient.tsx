"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { formatINR, useCart, type CartItem } from "@/app/components/CartProvider";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ShippingForm = {
  email: string;
  first_name: string;
  last_name: string;
  apartment: string;
  state: string;
  pincode: string;
  phone: string;
  is_save: boolean;
};

type CreateOrderResponse = {
  success: boolean;
  message?: string;
  data?: {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    key: string;
    orderNumber: string;
    orderId: number;
    prefill: { name: string; email: string; contact: string };
  };
  errors?: Record<string, string[]>;
};

type RazorpayHandlerArgs = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
};

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const SHIPPING_STORAGE_KEY = "vishwakarma_last_shipping_v1";

const blank: ShippingForm = {
  email: "",
  first_name: "",
  last_name: "",
  apartment: "",
  state: "",
  pincode: "",
  phone: "",
  is_save: false,
};

const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const cartLineToApiItem = (it: CartItem) => ({
  productId: it.productId ?? 0,
  productType: it.productType,
  sizeId: it.sizeId,
  productSize: it.size,
  variation: it.variation,
  giftWrapping: it.giftWrapping ?? "no",
  frontMessage: it.frontMessage,
  backMessage: it.backMessage,
  frontImageUrl: it.frontImageUrl,
  backImageUrl: it.backImageUrl,
  quantity: it.quantity,
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CheckoutClient({
  states,
}: {
  states: readonly string[];
}) {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [form, setForm] = useState<ShippingForm>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingForm, string>>>(
    {},
  );
  const [pincodeStatus, setPincodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{
    kind: "info" | "error";
    text: string;
  } | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Hydrate last-used shipping from localStorage (matches `$lastShipping` prefill)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SHIPPING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ShippingForm>;
        setForm((f) => ({ ...f, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Subtotal recompute (already exposed by useCart, but kept local for clarity)
  const subtotal = useMemo(() => total, [total]);
  const empty = items.length === 0;

  /* ----- field handlers ----- */
  const setField = <K extends keyof ShippingForm>(
    key: K,
    value: ShippingForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /* ----- pincode async validation (api.postalpincode.in, same as Blade) ----- */
  useEffect(() => {
    if (!/^\d{6}$/.test(form.pincode)) {
      setPincodeStatus("idle");
      return;
    }
    const controller = new AbortController();
    setPincodeStatus("checking");
    fetch(`https://api.postalpincode.in/pincode/${form.pincode}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const ok =
          Array.isArray(data) &&
          data[0]?.Status === "Success" &&
          Array.isArray(data[0]?.PostOffice) &&
          data[0].PostOffice.length > 0;
        setPincodeStatus(ok ? "valid" : "invalid");
      })
      .catch(() => {
        // ignore aborts; show a soft error otherwise
        if (!controller.signal.aborted) setPincodeStatus("invalid");
      });
    return () => controller.abort();
  }, [form.pincode]);

  /* ----- client validation ----- */
  const validate = useCallback((): boolean => {
    const next: Partial<Record<keyof ShippingForm, string>> = {};
    if (!isEmail(form.email))
      next.email = "Please enter a valid email address";
    if (!form.first_name.trim())
      next.first_name = "Please enter your first name";
    if (!form.state) next.state = "Please select a state";
    if (!/^\d{6}$/.test(form.pincode))
      next.pincode = "PIN code must be 6 digits";
    else if (pincodeStatus === "invalid") next.pincode = "Invalid PIN code";
    if (!/^\d{10}$/.test(form.phone))
      next.phone = "Phone must be exactly 10 digits";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, pincodeStatus]);

  /* ----- pay now ----- */
  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBanner(null);

      if (empty) {
        setBanner({ kind: "error", text: "Your cart is empty." });
        return;
      }
      if (!validate()) return;
      if (!window.Razorpay) {
        setBanner({
          kind: "error",
          text: "Payment library is still loading. Please try again in a moment.",
        });
        return;
      }

      setSubmitting(true);

      // Persist for next checkout (matches `is_save` behaviour)
      if (form.is_save) {
        try {
          window.localStorage.setItem(
            SHIPPING_STORAGE_KEY,
            JSON.stringify(form),
          );
        } catch {
          /* ignore quota */
        }
      }

      try {
        // 1) Create order on the server
        const createRes = await fetch("/api/checkout/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shipping: {
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              address: "",
              apartment: form.apartment.trim(),
              city: "",
              state: form.state,
              pincode: form.pincode,
              is_save: form.is_save,
            },
            items: items.map(cartLineToApiItem),
          }),
        });
        const created = (await createRes.json()) as CreateOrderResponse;
        if (!created.success || !created.data) {
          // Surface field-level errors (e.g. phone, pincode) instead of the
          // generic "Invalid checkout payload" message returned by Zod.
          const fieldMsg = created.errors
            ? Object.entries(created.errors)
                .map(
                  ([field, msgs]) =>
                    `${field}: ${(msgs ?? []).join(", ")}`,
                )
                .join(" • ")
            : "";
          setBanner({
            kind: "error",
            text:
              fieldMsg ||
              created.message ||
              "We couldn't start your order. Please try again.",
          });
          setSubmitting(false);
          return;
        }

        const { razorpayOrderId, amount, currency, key, prefill } =
          created.data;

        // 2) Open Razorpay
        const rzp = new window.Razorpay({
          key,
          amount,
          currency,
          name: "Vishwakarma Gifts",
          description: "Order Payment",
          order_id: razorpayOrderId,
          prefill,
          notes: { source: "next.js-checkout" },
          theme: { color: "#613a18" },
          // Explicitly enable UPI alongside the other common methods so the
          // checkout always shows a "Pay via UPI" option (UPI ID + apps + QR).
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
          // Promote UPI to the top of the modal as a preferred block and
          // explicitly enable all three UPI flows so the user always gets:
          //   - "collect"  → enter UPI ID (e.g. name@okaxis) input box
          //   - "intent"   → choose GPay/PhonePe/Paytm/BHIM app (mobile)
          //   - "qr"       → scan a UPI QR (desktop)
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [
                    {
                      method: "upi",
                      flows: ["collect", "intent", "qr"],
                    },
                  ],
                },
              },
              sequence: ["block.upi"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          modal: {
            ondismiss: () => setSubmitting(false),
          },
          handler: async (resp: unknown) => {
            const r = resp as RazorpayHandlerArgs;
            try {
              const verifyRes = await fetch(
                "/api/checkout/verify-payment",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(r),
                },
              );
              const verified = (await verifyRes.json()) as {
                success: boolean;
                message?: string;
                data?: { orderId: number };
              };
              if (verified.success && verified.data) {
                clearCart();
                router.push(
                  `/order/success?order=${encodeURIComponent(
                    razorpayOrderId,
                  )}&payment=${encodeURIComponent(r.razorpay_payment_id)}`,
                );
              } else {
                setBanner({
                  kind: "error",
                  text:
                    verified.message ??
                    "Payment verification failed. Please contact support if money was deducted.",
                });
                setSubmitting(false);
              }
            } catch {
              setBanner({
                kind: "error",
                text:
                  "Payment verification failed. Please contact support if money was deducted.",
              });
              setSubmitting(false);
            }
          },
        });

        rzp.on("payment.failed", (resp: unknown) => {
          const r = resp as { error?: { description?: string } };
          setBanner({
            kind: "error",
            text:
              r.error?.description ??
              "Payment failed. Please try again or use a different method.",
          });
          setSubmitting(false);
        });

        rzp.open();
      } catch {
        setBanner({
          kind: "error",
          text: "Something went wrong. Please try again.",
        });
        setSubmitting(false);
      }
    },
    [items, validate, form, empty, clearCart, router],
  );

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />

      <div className="container checkout-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link href="/login" className="donate-btn">
            Login
          </Link>
        </div>

        {banner && (
          <div
            className={`status-banner status-banner--${banner.kind}`}
            role={banner.kind === "error" ? "alert" : "status"}
          >
            {banner.text}
          </div>
        )}

        <div className="row">
          {/* Left: form */}
          <div className="col-lg-7">
            <div className="p-4 bg-white border rounded mb-4">
              <form
                id="checkout-form"
                noValidate
                onSubmit={onSubmit}
                aria-busy={submitting}
              >
                <div className="from-typedrt">
                  <h5>Contact</h5>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={`form-control mb-0 ${errors.email ? "is-invalid" : ""}`}
                    placeholder="Email"
                    required
                  />
                  {errors.email && (
                    <small className="text-danger">{errors.email}</small>
                  )}

                  <h5 className="pt-2 pb-2">Delivery</h5>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        name="first_name"
                        autoComplete="given-name"
                        value={form.first_name}
                        onChange={(e) => setField("first_name", e.target.value)}
                        className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                        placeholder="Full Name"
                        required
                      />
                      {errors.first_name && (
                        <small className="text-danger">
                          {errors.first_name}
                        </small>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    name="apartment"
                    autoComplete="address-line1"
                    value={form.apartment}
                    onChange={(e) => setField("apartment", e.target.value)}
                    className="form-control mb-3"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <select
                        className={`form-select ${errors.state ? "is-invalid" : ""}`}
                        name="state"
                        value={form.state}
                        onChange={(e) => setField("state", e.target.value)}
                        required
                      >
                        <option value="">Select state</option>
                        {states.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.state && (
                        <small className="text-danger">{errors.state}</small>
                      )}
                    </div>
                    <div className="col-md-2">
                      <input
                        type="text"
                        name="pincode"
                        id="pincode"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        maxLength={6}
                        className={`form-control pincoe ${
                          pincodeStatus === "invalid" || errors.pincode
                            ? "is-invalid"
                            : pincodeStatus === "valid"
                              ? "is-valid"
                              : ""
                        }`}
                        placeholder="PIN code"
                        value={form.pincode}
                        onChange={(e) =>
                          setField(
                            "pincode",
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        required
                      />
                      {(pincodeStatus === "invalid" || errors.pincode) && (
                        <small className="text-danger d-block">
                          {errors.pincode ?? "Invalid PIN code"}
                        </small>
                      )}
                    </div>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      setField(
                        "phone",
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    className={`form-control mb-1 ${errors.phone ? "is-invalid" : ""}`}
                    placeholder="Phone (10 digits)"
                    required
                  />
                  {errors.phone && (
                    <small className="text-danger">{errors.phone}</small>
                  )}
                  <div className="form-check mb-0 mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="saveInfo"
                      name="is_save"
                      checked={form.is_save}
                      onChange={(e) => setField("is_save", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="saveInfo">
                      Save this information for next time
                    </label>
                  </div>
                </div>

                <div className="payment-cardmethod">
                  <h2>Shipping method</h2>
                  <p className="text-muted">
                    Enter your shipping address to view available shipping
                    methods.
                  </p>

                  <h5>Payment</h5>
                </div>

                <div className="payment-box">
                  <p>
                    <strong>Razorpay Payment Gateway</strong> — UPI (GPay /
                    PhonePe / Paytm / BHIM), Cards, NetBanking &amp; Wallets
                  </p>
                  <div className="d-flex justify-content-start gap-2 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://img.icons8.com/color/48/visa.png"
                      height="24"
                      alt="Visa"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://img.icons8.com/color/48/mastercard-logo.png"
                      height="24"
                      alt="MasterCard"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://img.icons8.com/color/48/000000/rupay.png"
                      height="24"
                      alt="RuPay"
                    />
                  </div>
                  <p className="small text-muted">
                    After clicking &quot;Pay now&quot;, you will be redirected
                    to the Payment Gateway to complete your purchase securely.
                  </p>
                </div>

                <button
                  type="submit"
                  className="pay-button"
                  disabled={submitting || empty || !scriptReady}
                >
                  {submitting
                    ? "Processing…"
                    : empty
                      ? "Your cart is empty"
                      : !scriptReady
                        ? "Loading payment…"
                        : "Pay now"}
                </button>
              </form>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="col-lg-5">
            <div className="card order-summary">
              <h6>Your Order</h6>
              {empty ? (
                <div className="empty-cart">
                  <p>Your cart is empty.</p>
                  <Link href="/products" className="donate-btn">
                    Continue shopping
                  </Link>
                </div>
              ) : (
                <ul>
                  {items.map((it) => (
                    <li key={it.id}>
                      <div className="prt-list-data">
                        <div className="review-product-img-container">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.image || "/img/no-image.png"}
                            className="review-product-img me-3"
                            alt={it.name}
                          />
                        </div>
                        <div className="personalized-wooden-slice">
                          <strong>{it.name}</strong>
                          {it.size && (
                            <p>
                              <strong>Size:</strong> {it.size}
                            </p>
                          )}
                          <p className="mb-0 small">Qty: {it.quantity}</p>
                        </div>
                        <div className="product-cont-money">
                          ₹{formatINR(it.price * it.quantity)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {!empty && (
                <>
                  <hr />
                  <div className="totlal-amountdata">
                    <span>Subtotal</span>
                    <strong>₹{formatINR(subtotal)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Shipping</span>
                    <span>—</span>
                  </div>
                  <hr />
                  <div className="allprice-data">
                    <span>
                      <strong>Total</strong>
                    </span>
                    <span>
                      <strong>₹{formatINR(subtotal)}</strong>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

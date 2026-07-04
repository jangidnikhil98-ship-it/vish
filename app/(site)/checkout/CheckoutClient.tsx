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
  address: string; // Street address — REQUIRED for courier pickup
  apartment: string;
  city: string; // REQUIRED for Shiprocket
  state: string;
  pincode: string;
  phone: string;
  is_save: boolean;
};

type PaymentMethod = "razorpay" | "cod";

type CreateOrderResponse = {
  success: boolean;
  message?: string;
  data?:
    | {
        paymentMethod: "razorpay";
        razorpayOrderId: string;
        amount: number; // paise
        currency: string;
        key: string;
        orderNumber: string;
        orderId: number;
        breakdown: PriceBreakdown;
        prefill: { name: string; email: string; contact: string };
      }
    | {
        paymentMethod: "cod";
        amount: number; // INR rupees
        currency: string;
        orderNumber: string;
        orderId: number;
        breakdown: PriceBreakdown;
      };
  errors?: Record<string, string[]>;
};

type ApplyCouponResponse = {
  success: boolean;
  message?: string;
  data?: {
    code: string;
    type: "percent" | "free_shipping";
    discountAmount: number;
    freeShipping: boolean;
    message: string;
    subtotal: number;
  };
};

type ServiceabilityResponse = {
  success: boolean;
  data?: {
    serviceable: boolean;
    codAvailable: boolean;
    cheapestRate: number | null;
    estimatedDays: number | null;
  };
};

interface PriceBreakdown {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  codFee: number;
  total: number;
}

interface AppliedCoupon {
  code: string;
  type: "percent" | "free_shipping";
  discountAmount: number;
  freeShipping: boolean;
}

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
  address: "",
  apartment: "",
  city: "",
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

interface CheckoutSettings {
  codEnabled: boolean;
  codFee: number;
  defaultShippingFee: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CheckoutClient({
  states,
  settings,
}: {
  states: readonly string[];
  settings: CheckoutSettings;
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
  const [pincodeServiceable, setPincodeServiceable] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{
    kind: "info" | "error" | "success";
    text: string;
  } | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  /* ----- payment method ----- */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [codAvailable, setCodAvailable] = useState<boolean>(settings.codEnabled);

  /* ----- coupon state ----- */
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  /* ----- idempotency key (regenerated per form mount) ----- */
  const [idempotencyKey] = useState<string>(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  });

  /* ----- hydrate last-used shipping from localStorage ----- */
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

  /* ----- Subtotal + computed totals ----- */
  const subtotal = useMemo(() => total, [total]);
  const empty = items.length === 0;

  const breakdown = useMemo<PriceBreakdown>(() => {
    const discountAmount = appliedCoupon?.discountAmount ?? 0;
    const baseShipping = settings.defaultShippingFee;
    const shippingFee = appliedCoupon?.freeShipping ? 0 : baseShipping;
    const codFee = paymentMethod === "cod" ? settings.codFee : 0;
    const t =
      Math.round((subtotal - discountAmount + shippingFee + codFee) * 100) /
      100;
    return {
      subtotal,
      discountAmount,
      shippingFee,
      codFee,
      total: t < 0 ? 0 : t,
    };
  }, [subtotal, appliedCoupon, paymentMethod, settings]);

  /* ----- field handlers ----- */
  const setField = <K extends keyof ShippingForm>(
    key: K,
    value: ShippingForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /* ----- pincode async validation + serviceability check (always) ---- */
  useEffect(() => {
    if (!/^\d{6}$/.test(form.pincode)) {
      setPincodeStatus("idle");
      setPincodeServiceable(true);
      setCodAvailable(settings.codEnabled);
      return;
    }
    const controller = new AbortController();
    setPincodeStatus("checking");

    // Run the two checks in parallel: India Post validity + Shiprocket
    // serviceability (run for prepaid AND COD — we want to refuse orders
    // whose pincode no courier serves regardless of payment method).
    const indiaPost = fetch(
      `https://api.postalpincode.in/pincode/${form.pincode}`,
      { signal: controller.signal },
    )
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
        if (!controller.signal.aborted) setPincodeStatus("invalid");
      });

    const codFlag = settings.codEnabled ? 1 : 0;
    const shipCheck = fetch(
      `/api/shipping/serviceability?deliveryPincode=${form.pincode}&cod=${codFlag}`,
      { signal: controller.signal },
    )
      .then((r) => r.json() as Promise<ServiceabilityResponse>)
      .then((res) => {
        if (res.success && res.data) {
          setPincodeServiceable(res.data.serviceable);
          setCodAvailable(res.data.codAvailable && settings.codEnabled);
          if (!res.data.codAvailable && paymentMethod === "cod") {
            setPaymentMethod("razorpay");
          }
        }
      })
      .catch(() => {
        // If serviceability fails (e.g. Shiprocket not configured yet),
        // assume serviceable — better to risk a manual review than block
        // every checkout.
        setPincodeServiceable(true);
      });

    void Promise.allSettled([indiaPost, shipCheck]);
    return () => controller.abort();
  }, [form.pincode, settings.codEnabled, paymentMethod]);

  /* ----- auto-clear coupon when cart contents change ---- */
  useEffect(() => {
    // The applied coupon was computed against an earlier snapshot of the
    // cart. Re-resolving on every keystroke would spam the API, so we just
    // drop the applied state and prompt the user to re-apply.
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponMessage(
        "Cart changed — please re-apply your coupon for the updated discount.",
      );
    }
    // We deliberately depend on cart subtotal + count, not items reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, items.length]);

  /* ----- coupon apply / remove ----- */
  const applyCoupon = useCallback(async () => {
    if (couponBusy) return;
    setCouponError(null);
    setCouponMessage(null);
    const code = couponInput.trim().toUpperCase();
    if (code.length < 2) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    if (empty) {
      setCouponError("Add items to your cart first.");
      return;
    }
    setCouponBusy(true);
    try {
      const res = await fetch("/api/checkout/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map(cartLineToApiItem),
          paymentMethod,
        }),
      });
      const json = (await res.json()) as ApplyCouponResponse;
      if (!json.success || !json.data) {
        setCouponError(json.message ?? "Could not apply coupon.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({
        code: json.data.code,
        type: json.data.type,
        discountAmount: json.data.discountAmount,
        freeShipping: json.data.freeShipping,
      });
      setCouponMessage(json.data.message);
    } catch {
      setCouponError("Network error. Please try again.");
    } finally {
      setCouponBusy(false);
    }
  }, [couponInput, items, empty, paymentMethod, couponBusy]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
    setCouponError(null);
  }, []);

  /* ----- client validation ----- */
  const validate = useCallback((): boolean => {
    const next: Partial<Record<keyof ShippingForm, string>> = {};
    if (!isEmail(form.email))
      next.email = "Please enter a valid email address";
    if (!form.first_name.trim())
      next.first_name = "Please enter your first name";
    if (form.address.trim().length < 5)
      next.address = "Please enter a complete street address";
    if (form.city.trim().length < 2)
      next.city = "Please enter your city";
    if (!form.state) next.state = "Please select a state";
    if (!/^\d{6}$/.test(form.pincode))
      next.pincode = "PIN code must be 6 digits";
    else if (pincodeStatus === "invalid") next.pincode = "Invalid PIN code";
    else if (pincodeStatus === "checking")
      next.pincode = "Please wait — verifying PIN code…";
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
      if (paymentMethod === "razorpay" && !window.Razorpay) {
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
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            shipping: {
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              address: form.address.trim(),
              apartment: form.apartment.trim(),
              city: form.city.trim(),
              state: form.state,
              pincode: form.pincode,
              is_save: form.is_save,
            },
            items: items.map(cartLineToApiItem),
            couponCode: appliedCoupon?.code ?? "",
            paymentMethod,
          }),
        });
        const created = (await createRes.json()) as CreateOrderResponse;
        if (!created.success || !created.data) {
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

        /* ============================================================
           Branch A — COD: the order is already placed. Just clear cart
           and redirect to the success page.
           ============================================================ */
        if (created.data.paymentMethod === "cod") {
          clearCart();
          router.push(
            `/order/success?order_number=${encodeURIComponent(
              created.data.orderNumber,
            )}&method=cod`,
          );
          return;
        }

        /* ============================================================
           Branch A2 — 100%-off coupon: server marked the order paid
           immediately, no Razorpay round trip needed.
           ============================================================ */
        if (
          created.data.paymentMethod === "razorpay" &&
          (created.data as { freeOrder?: boolean }).freeOrder
        ) {
          clearCart();
          router.push(
            `/order/success?order_number=${encodeURIComponent(
              created.data.orderNumber,
            )}&method=free`,
          );
          return;
        }

        /* ============================================================
           Branch B — Razorpay: open the modal as before.
           ============================================================ */
        const { razorpayOrderId, amount, currency, key, prefill } =
          created.data;

        const rzp = new window.Razorpay!({
          key,
          amount,
          currency,
          name: "Vishwakarma Gifts",
          description: "Order Payment",
          order_id: razorpayOrderId,
          prefill,
          notes: { source: "next.js-checkout" },
          theme: { color: "#613a18" },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
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
              preferences: { show_default_blocks: true },
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
    [
      items,
      validate,
      form,
      empty,
      clearCart,
      router,
      paymentMethod,
      appliedCoupon,
    ],
  );

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  const payButtonLabel = (() => {
    if (submitting) return "Processing…";
    if (empty) return "Your cart is empty";
    if (paymentMethod === "razorpay" && !scriptReady) return "Loading payment…";
    if (paymentMethod === "cod")
      return `Place Order (Pay ₹${formatINR(breakdown.total)} on delivery)`;
    return `Pay ₹${formatINR(breakdown.total)}`;
  })();

  const payDisabled =
    submitting ||
    empty ||
    (paymentMethod === "razorpay" && !scriptReady) ||
    pincodeStatus === "checking" ||
    pincodeStatus === "invalid" ||
    !pincodeServiceable;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />

      <div className="container checkout-container">
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#3b2512', margin: 0, letterSpacing: '-0.02em' }}>Checkout</h1>
          <Link href="/login?redirect=/checkout" className="donate-btn">
            Log in for faster checkout
          </Link>
        </div>

        {banner && (
          <div
            className={`status-banner status-banner--${banner.kind}`}
            role={banner.kind === "error" ? "alert" : "status"}
          >
            {banner.kind === "error" ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {banner.text}
          </div>
        )}

        <div className="row">
          {/* Left: form */}
          <div className="col-lg-7">
            <div className="p-4 p-md-5 bg-white border rounded-[16px] mb-4 shadow-sm" style={{ borderColor: '#e9d8c6' }}>
              <form
                id="checkout-form"
                noValidate
                onSubmit={onSubmit}
                aria-busy={submitting}
              >
                <div className="from-typedrt">
                  <h5 className="mb-3">Contact Information</h5>
                  <div className="mb-4">
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      className={`form-control mb-1 ${errors.email ? "is-invalid" : ""}`}
                      placeholder="Email Address"
                      required
                    />
                    {errors.email && (
                      <small className="text-danger">{errors.email}</small>
                    )}
                  </div>

                  <h5 className="pt-3 mb-3 border-top mt-4" style={{ borderColor: '#f0e4d8 !important' }}>Shipping Address</h5>
                  <div className="row mb-3">
                    <div className="col-md-12">
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
                    name="address"
                    autoComplete="address-line1"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    className={`form-control mb-2 ${errors.address ? "is-invalid" : ""}`}
                    placeholder="Street address (house no., area, road)"
                    required
                  />
                  {errors.address && (
                    <small className="text-danger d-block mb-2">
                      {errors.address}
                    </small>
                  )}
                  <input
                    type="text"
                    name="apartment"
                    autoComplete="address-line2"
                    value={form.apartment}
                    onChange={(e) => setField("apartment", e.target.value)}
                    className="form-control mb-3"
                    placeholder="Apartment, suite, landmark (optional)"
                  />
                  <div className="row mb-3 g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        name="city"
                        autoComplete="address-level2"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        className={`form-control ${errors.city ? "is-invalid" : ""}`}
                        placeholder="City / Town"
                        required
                      />
                      {errors.city && (
                        <small className="text-danger d-block">
                          {errors.city}
                        </small>
                      )}
                    </div>
                    <div className="col-md-4">
                      <select
                        className={`form-select ${errors.state ? "is-invalid" : ""}`}
                        name="state"
                        value={form.state}
                        onChange={(e) => setField("state", e.target.value)}
                        required
                      >
                        <option value="">Select State</option>
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
                    <div className="col-md-4">
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
                      {pincodeStatus === "valid" && !pincodeServiceable && (
                        <small className="text-danger d-block">
                          Sorry, no courier serves this PIN code. Please
                          contact us before placing the order.
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
                    placeholder="Phone Number (10 digits)"
                    required
                  />
                  {errors.phone && (
                    <small className="text-danger">{errors.phone}</small>
                  )}
                  <div className="form-check mb-0 mt-3 d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="saveInfo"
                      name="is_save"
                      checked={form.is_save}
                      onChange={(e) => setField("is_save", e.target.checked)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', marginTop: 0 }}
                    />
                    <label className="form-check-label text-muted" htmlFor="saveInfo" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                      Save this information for next time
                    </label>
                  </div>
                </div>

                <div className="payment-cardmethod border-top pt-4 mt-4" style={{ borderColor: '#f0e4d8 !important' }}>
                  <h5 className="mb-3">Payment Method</h5>
                </div>

                {/* ============ Payment-method radio group ============ */}
                <div
                  className="payment-method-group"
                  role="radiogroup"
                  aria-label="Payment method"
                  style={{ display: "grid", gap: 12, marginBottom: 24 }}
                >
                  {/* --- Razorpay --- */}
                  <label
                    className={`payment-method-card${paymentMethod === "razorpay" ? " is-selected" : ""}`}
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                      padding: 16,
                      border: `2px solid ${paymentMethod === "razorpay" ? "#613a18" : "#e9d8c6"}`,
                      borderRadius: 12,
                      background: paymentMethod === "razorpay" ? "#fcf9f5" : "#fff",
                      cursor: "pointer",
                      transition: "all .2s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      style={{ marginTop: 5, accentColor: '#613a18', transform: 'scale(1.2)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#3b2512', fontSize: '1.05rem', marginBottom: '4px' }}>
                        Pay Online (Secure)
                      </div>
                      <small className="text-muted d-block mb-3" style={{ fontSize: '0.85rem' }}>
                        UPI, Cards, NetBanking, Wallets securely via Razorpay.
                      </small>
                      <div className="d-flex gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://img.icons8.com/color/48/google-pay-india.png" height="24" alt="GPay" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://img.icons8.com/color/48/visa.png" height="24" alt="Visa" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://img.icons8.com/color/48/mastercard-logo.png" height="24" alt="MasterCard" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://img.icons8.com/color/48/000000/rupay.png" height="24" alt="RuPay" />
                      </div>
                    </div>
                  </label>

                  {/* --- COD --- */}
                  {settings.codEnabled ? (
                    <label
                      className={`payment-method-card${paymentMethod === "cod" ? " is-selected" : ""}`}
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                        padding: 16,
                        border: `2px solid ${paymentMethod === "cod" ? "#613a18" : "#e9d8c6"}`,
                        borderRadius: 12,
                        background: paymentMethod === "cod" ? "#fcf9f5" : (codAvailable ? "#fff" : "#f9f9f9"),
                        cursor: codAvailable ? "pointer" : "not-allowed",
                        opacity: codAvailable ? 1 : 0.6,
                        transition: "all .2s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        disabled={!codAvailable}
                        onChange={() => setPaymentMethod("cod")}
                        style={{ marginTop: 5, accentColor: '#613a18', transform: 'scale(1.2)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#3b2512', fontSize: '1.05rem', marginBottom: '4px' }}>
                          Cash on Delivery
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                          {codAvailable
                            ? `Pay with cash upon delivery.${settings.codFee > 0 ? ` A ₹${formatINR(settings.codFee)} fee applies.` : ""}`
                            : pincodeStatus === "valid"
                              ? "Not available for your PIN code."
                              : "Enter a valid PIN code to check COD."}
                        </small>
                      </div>
                    </label>
                  ) : null}
                </div>

                <div className="d-flex flex-column align-items-center mt-2">
                  <button
                    type="submit"
                    className="pay-button"
                    disabled={payDisabled}
                  >
                    {submitting ? (
                      <div className="spinner-border spinner-border-sm text-light mr-2" role="status"></div>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    )}
                    {payButtonLabel}
                  </button>
                  <div className="mt-3 text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    256-bit SSL encrypted & secure checkout
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="col-lg-5 mt-4 mt-lg-0">
            <div className="order-summary">
              <h6>Order Summary</h6>
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
                            className="review-product-img"
                            alt={it.name}
                          />
                          <span className="review-product-badge">{it.quantity}</span>
                        </div>
                        <div className="personalized-wooden-slice">
                          <strong>{it.name}</strong>
                          {it.size && (
                            <p>
                              Size: {it.size}
                            </p>
                          )}
                          {(it.frontMessage || it.backMessage) && (
                            <p className="mt-1" style={{ fontSize: '0.8rem' }}>
                              Customized
                            </p>
                          )}
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
                  {/* ============== Coupon block ============== */}
                  <div className="coupon-block">
                    {appliedCoupon ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#eef8f1",
                          border: "1px solid #c3e6cb",
                          borderRadius: 8,
                          padding: "10px 14px",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#155724', fontSize: '0.95rem' }}>
                            ✓ {appliedCoupon.code}
                          </div>
                          <small style={{ color: '#28a745' }}>
                            {couponMessage ?? "Coupon applied"}
                          </small>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#721c24",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontSize: '0.85rem'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <label
                          className="form-label text-muted mb-2"
                          style={{ fontSize: '0.9rem' }}
                        >
                          Discount code or gift card
                        </label>
                        <div className="d-flex gap-2">
                          <input
                            type="text"
                            className="form-control mb-0"
                            placeholder="Enter code"
                            value={couponInput}
                            onChange={(e) =>
                              setCouponInput(
                                e.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9_-]/g, "")
                                  .slice(0, 32),
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void applyCoupon();
                              }
                            }}
                            style={{ textTransform: "uppercase", background: '#fff' }}
                          />
                          <button
                            type="button"
                            className="donate-btn"
                            disabled={couponBusy || empty || !couponInput.trim()}
                            onClick={() => void applyCoupon()}
                            style={{ whiteSpace: "nowrap", opacity: (!couponInput.trim() || couponBusy) ? 0.6 : 1 }}
                          >
                            {couponBusy ? "..." : "Apply"}
                          </button>
                        </div>
                        {couponError ? (
                          <small
                            className="text-danger d-block mt-2"
                          >
                            {couponError}
                          </small>
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* ============== Totals ============== */}
                  <div className="mt-4 pt-4 border-top" style={{ borderColor: '#e9d8c6 !important' }}>
                    <div className="totlal-amountdata">
                      <span>Subtotal</span>
                      <strong style={{ fontWeight: 500 }}>₹{formatINR(breakdown.subtotal)}</strong>
                    </div>

                    {breakdown.discountAmount > 0 ? (
                      <div
                        className="d-flex justify-content-between pb-2"
                        style={{ color: "#2c8b3d" }}
                      >
                        <span>
                          Discount{" "}
                          {appliedCoupon ? `(${appliedCoupon.code})` : ""}
                        </span>
                        <span style={{ fontWeight: 500 }}>− ₹{formatINR(breakdown.discountAmount)}</span>
                      </div>
                    ) : null}

                    <div className="d-flex justify-content-between pb-2">
                      <span>Shipping</span>
                      <span style={{ fontWeight: 500 }}>
                        {breakdown.shippingFee > 0
                          ? `₹${formatINR(breakdown.shippingFee)}`
                          : appliedCoupon?.freeShipping
                            ? "Free (coupon)"
                            : "Free"}
                      </span>
                    </div>

                    {breakdown.codFee > 0 ? (
                      <div className="d-flex justify-content-between pb-2">
                        <span>COD fee</span>
                        <span style={{ fontWeight: 500 }}>₹{formatINR(breakdown.codFee)}</span>
                      </div>
                    ) : null}

                    <div className="allprice-data border-top mt-3 pt-3" style={{ borderColor: '#e9d8c6 !important' }}>
                      <span style={{ color: '#3b2512' }}>
                        <strong>Total</strong>
                      </span>
                      <span style={{ color: '#3b2512', fontSize: '1.4rem' }}>
                        <strong>₹{formatINR(breakdown.total)}</strong>
                      </span>
                    </div>
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

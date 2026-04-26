"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useCart, formatINR } from "@/app/components/CartProvider";

/* ============================================================
   GALLERY
   ============================================================ */
export function Gallery({
  images,
  fallbackImage,
  productName,
}: {
  images: string[];
  fallbackImage: string;
  productName: string;
}) {
  const list = useMemo(
    () => (images.length > 0 ? images.map(toSrc) : [fallbackImage]),
    [images, fallbackImage],
  );
  const [active, setActive] = useState(list[0]);

  return (
    <div className="product-details-outer">
      <div className="image-wrapper-details">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          id="mainProductImage"
          src={active}
          className="default-img"
          alt={productName}
        />
      </div>
      <div className="product-detailsimages">
        {list.map((src, i) => (
          <div
            key={src + i}
            className={`product-detailsimages-list ${
              src === active ? "active" : ""
            }`}
            onClick={() => setActive(src)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setActive(src);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} className="default-img" alt={productName} />
          </div>
        ))}
      </div>
    </div>
  );
}

function toSrc(img: string): string {
  if (!img) return "/img/no-image.png";
  if (img.startsWith("http") || img.startsWith("/")) return img;
  return `/storage/${img}`;
}

/* ============================================================
   FORM (sizes + variation + customisation + add to cart)
   ============================================================ */
type Size = {
  id: number;
  label: string | null;
  price: number;
  finalPrice: number;
  discount: number;
  isDefault: boolean;
};

type Errors = Partial<
  Record<"front_message" | "front_image" | "back_message" | "back_image", string>
>;

/**
 * One side's upload state.
 *  - `preview` is an in-memory blob URL we show instantly so the user sees
 *    their photo before the network round-trip finishes.
 *  - `status` is "uploading" while we compress + POST, "done" once the
 *    server returns a stored path, "error" on failure.
 *  - `promise` lets `Add to Cart` await an in-flight upload silently if the
 *    user clicks before it finishes — no more blocking the whole UI.
 */
type UploadSlot = {
  fileName: string;
  preview: string;
  status: "uploading" | "done" | "error";
  serverPath?: string;
  error?: string;
  promise?: Promise<string>;
};

export function Form({
  productId,
  productType,
  productName,
  productSlug,
  productImage,
  sizes,
  initialSizeId,
}: {
  productId: number;
  productType: string;
  productName: string;
  productSlug: string;
  productImage: string;
  sizes: Size[];
  initialSizeId?: number;
}) {
  const router = useRouter();
  const { addItem } = useCart();

  /* ----- selected size + price ----- */
  const [sizeId, setSizeId] = useState<number | undefined>(initialSizeId);
  const selectedSize = useMemo(
    () => sizes.find((s) => s.id === sizeId) ?? sizes[0] ?? null,
    [sizes, sizeId],
  );

  /* ----- variation: one_side | both_sides ----- */
  const [variation, setVariation] = useState<"one_side" | "both_sides">(
    "one_side",
  );

  /* ----- customisation form state ----- */
  const [frontMessage, setFrontMessage] = useState("");
  const [backMessage, setBackMessage] = useState("");
  const [frontUpload, setFrontUpload] = useState<UploadSlot | null>(null);
  const [backUpload, setBackUpload] = useState<UploadSlot | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);

  /**
   * Each slot holds a monotonic upload id. When the user picks a new file
   * before the previous upload finishes, we bump the id; the in-flight
   * promise's `.then` checks the id is still current before writing back
   * to state, so stale results never overwrite a newer upload.
   */
  const uploadIdRef = useRef<{ front: number; back: number }>({
    front: 0,
    back: 0,
  });

  /* Revoke any blob preview URLs when the component unmounts so we don't
     leak memory across page navigations. */
  useEffect(() => {
    return () => {
      if (frontUpload?.preview) URL.revokeObjectURL(frontUpload.preview);
      if (backUpload?.preview) URL.revokeObjectURL(backUpload.preview);
    };
    // We intentionally don't depend on the slots — the cleanup runs on unmount
    // and the per-slot preview URLs are revoked in `startUpload` whenever the
    // user picks a new file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Optimistic upload: show preview instantly, run compression + POST in
   * the background. Returns the promise so callers (Add to Cart) can await
   * it if they click before the upload finishes.
   */
  const startUpload = useCallback(
    (file: File, side: "front" | "back"): Promise<string> => {
      uploadIdRef.current[side] += 1;
      const myId = uploadIdRef.current[side];
      const setSlot = side === "front" ? setFrontUpload : setBackUpload;
      const errorKey = side === "front" ? "front_image" : "back_image";

      // Free the previous preview URL (if any) before replacing it.
      setSlot((prev) => {
        if (prev?.preview) URL.revokeObjectURL(prev.preview);
        return prev;
      });

      const preview = URL.createObjectURL(file);
      const fileName = file.name;

      const promise = (async (): Promise<string> => {
        const { default: imageCompression } = await import(
          "browser-image-compression"
        );
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1200,
          initialQuality: 0.6,
          useWebWorker: true,
          fileType: "image/jpeg",
        });
        const fd = new FormData();
        fd.append("image", compressed);
        const res = await fetch("/api/upload/product-image", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message ?? "Upload failed");
        }
        return json.data.path as string;
      })();

      setSlot({
        fileName,
        preview,
        status: "uploading",
        promise,
      });
      setErrors((e) => ({ ...e, [errorKey]: undefined }));

      promise
        .then((path) => {
          if (uploadIdRef.current[side] !== myId) return;
          setSlot((prev) =>
            prev
              ? {
                  ...prev,
                  status: "done",
                  serverPath: path,
                  promise: undefined,
                }
              : prev,
          );
        })
        .catch((err: unknown) => {
          if (uploadIdRef.current[side] !== myId) return;
          const msg =
            err instanceof Error ? err.message : "Upload failed. Please retry.";
          setSlot((prev) =>
            prev ? { ...prev, status: "error", error: msg, promise: undefined } : prev,
          );
          setErrors((e) => ({ ...e, [errorKey]: msg }));
        });

      return promise;
    },
    [],
  );

  const onFrontFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    void startUpload(f, "front");
  };
  const onBackFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    void startUpload(f, "back");
  };

  /* ----- validation ----- */
  const validate = (): boolean => {
    const next: Errors = {};
    if (!frontMessage.trim())
      next.front_message =
        "Please enter the message you want to write on the frame.";
    if (!frontUpload)
      next.front_image = "Please choose the photo you want to customize.";
    else if (frontUpload.status === "error")
      next.front_image = frontUpload.error ?? "Upload failed. Please retry.";
    if (variation === "both_sides") {
      if (!backMessage.trim())
        next.back_message = "Please enter the back side message.";
      if (!backUpload)
        next.back_image = "Please choose the back side photo.";
      else if (backUpload.status === "error")
        next.back_image = backUpload.error ?? "Upload failed. Please retry.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /**
   * Resolves a slot's final server path. If the upload is still in flight,
   * we silently await it; if it has already errored, we surface the error.
   */
  const resolveSlot = async (
    slot: UploadSlot | null,
    errorKey: "front_image" | "back_image",
  ): Promise<string | null> => {
    if (!slot) return null;
    if (slot.serverPath) return slot.serverPath;
    if (slot.status === "error") {
      setErrors((e) => ({
        ...e,
        [errorKey]: slot.error ?? "Upload failed. Please retry.",
      }));
      return null;
    }
    if (slot.promise) {
      try {
        return await slot.promise;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Upload failed. Please retry.";
        setErrors((e) => ({ ...e, [errorKey]: msg }));
        return null;
      }
    }
    return null;
  };

  /* ----- add to cart / buy now ----- */
  const buildLineItem = async () => {
    if (!selectedSize) return null;

    const frontPath = await resolveSlot(frontUpload, "front_image");
    if (!frontPath) return null;

    let backPath = "";
    if (variation === "both_sides") {
      const resolved = await resolveSlot(backUpload, "back_image");
      if (!resolved) return null;
      backPath = resolved;
    }

    const lineId = `${productSlug}_${selectedSize.id}_${frontPath.slice(-8)}`;
    return {
      id: lineId,
      slug: productSlug,
      name: productName,
      image: productImage,
      price: selectedSize.finalPrice,
      quantity,
      size: selectedSize.label ?? undefined,
      productId,
      productType,
      sizeId: selectedSize.id,
      variation,
      frontMessage,
      backMessage: variation === "both_sides" ? backMessage : "",
      frontImageUrl: frontPath,
      backImageUrl: backPath,
    };
  };

  const openCartDrawer = () => {
    const el = document.getElementById("offcanvasExample");
    if (!el || typeof window === "undefined") return;
    const w = window as unknown as {
      bootstrap?: {
        Offcanvas: {
          getOrCreateInstance: (e: HTMLElement) => { show: () => void };
        };
      };
    };
    if (w.bootstrap?.Offcanvas) {
      w.bootstrap.Offcanvas.getOrCreateInstance(el).show();
      return;
    }
    // Bootstrap JS hasn't loaded yet — show a manual fallback.
    el.classList.add("show");
    el.style.visibility = "visible";
    document.body.style.overflow = "hidden";
    if (!document.getElementById("__cart-backdrop")) {
      const backdrop = document.createElement("div");
      backdrop.id = "__cart-backdrop";
      backdrop.className = "offcanvas-backdrop fade show";
      backdrop.addEventListener("click", () => {
        el.classList.remove("show");
        document.body.style.overflow = "";
        backdrop.remove();
      });
      document.body.appendChild(backdrop);
    }
  };

  const onAddToCart = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const item = await buildLineItem();
      if (!item) return;
      addItem(item);
      openCartDrawer();
    } finally {
      setSubmitting(false);
    }
  };

  const onBuyNow = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const item = await buildLineItem();
      if (!item) return;
      addItem(item);
      router.push("/checkout");
    } finally {
      setSubmitting(false);
    }
  };

  /* ----- price display ----- */
  const finalPrice = selectedSize?.finalPrice ?? 0;
  const originalPrice = selectedSize?.price ?? 0;
  const discount = selectedSize?.discount ?? 0;
  // We deliberately do NOT disable Add to Cart while an upload is in flight —
  // clicking it just awaits the in-flight upload silently. Only `submitting`
  // (the actual cart add) disables the button.
  const cartDisabled = submitting;

  return (
    <>
      <p className="price">
        <span className="discounted" id="display_discounted_price">
          Rs. {formatINR(finalPrice)}
        </span>
        {discount > 0 && (
          <>
            <span className="original" id="display_original_price">
              Rs. {formatINR(originalPrice)}
            </span>
            <span className="sale">Sale</span>
          </>
        )}
      </p>

      <p className="features">
        <i className="fa-solid fa-plus" /> <span> Free Shipping </span>
      </p>
      <p className="features">
        <i className="fa-solid fa-plus" />{" "}
        <span> Free Stand Wooden / Mdf</span>
      </p>
      <p className="features">
        <i className="fa-solid fa-plus" /> <span> Free Damage Cover </span>
      </p>
      <p className="features">
        <i className="fa-solid fa-plus" /> <span> Photo Customization </span>
      </p>

      {/* SIZES */}
      <div className="size-options">
        {sizes.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`size-btn ${s.id === sizeId ? "best-value active" : ""}`}
            onClick={() => setSizeId(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* VARIATIONS */}
      <div className="variation-options">
        <button
          type="button"
          className={variation === "one_side" ? "most-popular active" : ""}
          onClick={() => setVariation("one_side")}
        >
          One Side Photo & Message
        </button>
        {/*
        <button
          type="button"
          className={variation === "both_sides" ? "most-popular active" : ""}
          onClick={() => setVariation("both_sides")}
        >
          Both Sides Photos & Messages
        </button>
        */}
      </div>

      {/* CUSTOMISATION */}
      <div className="customize-section">
        <p>Customize Your Product Before Order! </p>

        <input
          type="text"
          id="front_message"
          placeholder="Please enter the message you want to write on the frame"
          className={`form-control mb-2 ${
            errors.front_message ? "is-invalid" : ""
          }`}
          value={frontMessage}
          onChange={(e) => {
            setFrontMessage(e.target.value);
            if (e.target.value.trim())
              setErrors((er) => ({ ...er, front_message: undefined }));
          }}
        />
        {errors.front_message && (
          <div className="invalid-feedback d-block">{errors.front_message}</div>
        )}

        {variation === "both_sides" && (
          <>
            <input
              type="text"
              id="back_message"
              placeholder="Back Side Message"
              className={`form-control mb-2 ${
                errors.back_message ? "is-invalid" : ""
              }`}
              value={backMessage}
              onChange={(e) => {
                setBackMessage(e.target.value);
                if (e.target.value.trim())
                  setErrors((er) => ({ ...er, back_message: undefined }));
              }}
            />
            {errors.back_message && (
              <div className="invalid-feedback d-block">
                {errors.back_message}
              </div>
            )}
          </>
        )}

        {/* FRONT IMAGE UPLOAD */}
        <UploadDropzone
          slot={frontUpload}
          label="Please upload the photo you want to customize."
          inputId="front_image"
          inputRef={frontFileRef}
          onFileSelected={onFrontFile}
          onRetry={() => frontFileRef.current?.click()}
          error={errors.front_image}
        />

        {/* BACK IMAGE UPLOAD */}
        {variation === "both_sides" && (
          <UploadDropzone
            slot={backUpload}
            label="Upload Back Image"
            inputId="back_image"
            inputRef={backFileRef}
            onFileSelected={onBackFile}
            onRetry={() => backFileRef.current?.click()}
            error={errors.back_image}
          />
        )}

        {/* QUANTITY + ACTIONS */}
        <div className="prtyuj">
          <div className="practice-plus-minus">
            <button
              type="button"
              className="minus"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              id="mtr_quantity"
              value={Number.isFinite(quantity) && quantity > 0 ? quantity : 1}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                if (raw === "") return;
                const v = parseInt(raw, 10);
                if (!Number.isNaN(v) && v >= 1) setQuantity(v);
              }}
              aria-label="Quantity"
            />
            <button
              type="button"
              className="plus"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>

          <div className="row mt-3">
            <div className="col-12 col-md-6 mb-2 mb-md-0">
              <button
                type="button"
                id="add-to-basket"
                className="add-to-cart donate-btn w-100"
                disabled={cartDisabled}
                onClick={onAddToCart}
              >
                {submitting ? "Adding…" : "Add to Cart"}
              </button>
            </div>
            <div className="col-12 col-md-6">
              <button
                type="button"
                id="buy-now"
                className="buy-now-btn donate-btn w-100"
                disabled={cartDisabled}
                onClick={onBuyNow}
              >
                {submitting ? "Processing…" : "Buy Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/*
        Note: the old full-screen .loderClass overlay has been removed.
        Uploads now run in the background while the rest of the form stays
        interactive. Per-slot status is shown inside <UploadDropzone />.
      */}
    </>
  );
}

/* ============================================================
   UPLOAD DROPZONE
   Shows the chosen photo's preview the moment a file is picked,
   plus a small inline status indicator (Uploading… / Ready / Error).
   ============================================================ */
function UploadDropzone({
  slot,
  label,
  inputId,
  inputRef,
  onFileSelected,
  onRetry,
  error,
}: {
  slot: UploadSlot | null;
  label: string;
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (e: ChangeEvent<HTMLInputElement>) => void;
  onRetry: () => void;
  error?: string;
}) {
  const hasPreview = !!slot?.preview;

  return (
    <div className="document-upload creat-artisttoken mb-sm-2 mb-0">
      <div className="form-group">
        <div
          className="dropzone dropzone-single dz-clickable"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          style={{ position: "relative" }}
        >
          <div className="dz-default dz-message">
            {hasPreview ? (
              <div
                className="upload-doc"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slot.preview}
                  alt={slot.fileName}
                  style={{
                    maxHeight: 140,
                    maxWidth: "100%",
                    objectFit: "contain",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                />
              </div>
            ) : (
              <div className="upload-doc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/frontend/upload.svg"
                  alt=""
                  className="img-fluid"
                />
              </div>
            )}

            <h6 style={{ marginTop: 8 }}>
              {hasPreview ? "Click to change photo" : label}
            </h6>

            <input
              ref={inputRef}
              type="file"
              id={inputId}
              accept="image/*"
              onChange={onFileSelected}
              style={{ display: "none" }}
            />

            {slot && (
              <div
                className="d-flex align-items-center justify-content-center mt-1"
                style={{ gap: 6, fontSize: "0.85rem", lineHeight: 1.2 }}
              >
                {slot.status === "uploading" && (
                  <>
                    <span
                      className="spinner-border spinner-border-sm text-secondary"
                      role="status"
                      aria-hidden="true"
                      style={{ width: 12, height: 12, borderWidth: 2 }}
                    />
                    <small className="text-muted">
                      Uploading in background…
                    </small>
                  </>
                )}
                {slot.status === "done" && (
                  <small className="text-success fw-semibold">Ready ✓</small>
                )}
                {slot.status === "error" && (
                  <>
                    <small className="text-danger">
                      {slot.error ?? "Upload failed"}
                    </small>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      style={{ fontSize: "0.85rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetry();
                      }}
                    >
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}

            {error && (
              <div
                className="invalid-feedback d-block"
                style={{ marginTop: 4 }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


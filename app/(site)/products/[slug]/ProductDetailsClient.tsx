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
  const [frontImageUrl, setFrontImageUrl] = useState("");
  const [backImageUrl, setBackImageUrl] = useState("");
  const [frontFileName, setFrontFileName] = useState("");
  const [backFileName, setBackFileName] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);

  /* ----- compress + upload ----- */
  const uploadImage = useCallback(
    async (file: File, side: "front" | "back") => {
      try {
        setUploading(true);

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
        const path = json.data.path as string;
        if (side === "front") {
          setFrontImageUrl(path);
          setErrors((e) => ({ ...e, front_image: undefined }));
        } else {
          setBackImageUrl(path);
          setErrors((e) => ({ ...e, back_image: undefined }));
        }
      } catch (err) {
        console.error("[upload]", err);
        const msg =
          err instanceof Error ? err.message : "Upload error. Please try again.";
        setErrors((e) => ({
          ...e,
          [side === "front" ? "front_image" : "back_image"]: msg,
        }));
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const onFrontFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFrontFileName(f.name);
    void uploadImage(f, "front");
  };
  const onBackFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBackFileName(f.name);
    void uploadImage(f, "back");
  };

  /* ----- validation ----- */
  const validate = (): boolean => {
    const next: Errors = {};
    if (!frontMessage.trim())
      next.front_message =
        "Please enter the message you want to write on the frame.";
    if (!frontImageUrl)
      next.front_image = "Please upload the photo you want to customize.";
    if (variation === "both_sides") {
      if (!backMessage.trim())
        next.back_message = "Please enter the back side message.";
      if (!backImageUrl)
        next.back_image = "Please upload the back side photo.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* ----- add to cart / buy now ----- */
  const buildLineItem = () => {
    if (!selectedSize) return null;
    const lineId = `${productSlug}_${selectedSize.id}_${frontImageUrl.slice(
      -8,
    )}`;
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
      frontImageUrl,
      backImageUrl: variation === "both_sides" ? backImageUrl : "",
    };
  };

  const onAddToCart = async () => {
    if (!validate() || submitting) return;
    const item = buildLineItem();
    if (!item) return;
    setSubmitting(true);
    try {
      addItem(item);
      const el = document.getElementById("offcanvasExample");
      if (el && typeof window !== "undefined") {
        const w = window as unknown as {
          bootstrap?: {
            Offcanvas: {
              getOrCreateInstance: (e: HTMLElement) => { show: () => void };
            };
          };
        };
        if (w.bootstrap?.Offcanvas) {
          w.bootstrap.Offcanvas.getOrCreateInstance(el).show();
        } else {
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
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onBuyNow = async () => {
    if (!validate() || submitting) return;
    const item = buildLineItem();
    if (!item) return;
    setSubmitting(true);
    try {
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
  const cartDisabled = uploading || submitting;

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
        <div className="document-upload creat-artisttoken mb-sm-2 mb-0">
          <div className="form-group">
            <div
              className="dropzone dropzone-single dz-clickable"
              onClick={() => frontFileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="dz-default dz-message">
                <div className="upload-doc">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/img/frontend/upload.svg"
                    alt=""
                    className="img-fluid"
                  />
                </div>
                <h6>Please upload the photo you want to customize.</h6>
                <input
                  ref={frontFileRef}
                  type="file"
                  id="front_image"
                  accept="image/*"
                  onChange={onFrontFile}
                  style={{ display: "none" }}
                />
                <span className="file-name">{frontFileName}</span>
                {errors.front_image && (
                  <div className="invalid-feedback d-block">
                    {errors.front_image}
                  </div>
                )}
                {uploading && (
                  <small className="text-muted d-block">
                    Compressing & uploading…
                  </small>
                )}
                {frontImageUrl && !uploading && (
                  <small className="text-success d-block">Uploaded</small>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BACK IMAGE UPLOAD */}
        {variation === "both_sides" && (
          <div className="document-upload creat-artisttoken mb-sm-2 mb-0">
            <div className="form-group">
              <div
                className="dropzone dropzone-single dz-clickable"
                onClick={() => backFileRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <div className="dz-default dz-message">
                  <div className="upload-doc">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/img/frontend/upload.svg"
                      alt=""
                      className="img-fluid"
                    />
                  </div>
                  <h6>Upload Back Image</h6>
                  <input
                    ref={backFileRef}
                    type="file"
                    id="back_image"
                    accept="image/*"
                    onChange={onBackFile}
                    style={{ display: "none" }}
                  />
                  <span className="file-name">{backFileName}</span>
                  {errors.back_image && (
                    <div className="invalid-feedback d-block">
                      {errors.back_image}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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
              type="number"
              id="mtr_quantity"
              value={quantity}
              min={1}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 1) setQuantity(v);
              }}
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

      {/* GLOBAL UPLOAD OVERLAY (kept compatible with original .loderClass) */}
      {uploading && (
        <div className="loaded loderClass">
          <div id="loader-wrapper" style={{ visibility: "visible" }}>
            <div id="loader" />
            <div className="loader-section section-left" />
            <div className="loader-section section-right" />
          </div>
        </div>
      )}
    </>
  );
}


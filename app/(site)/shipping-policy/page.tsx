import type { Metadata } from "next";
import "./shipping.css";

export const metadata: Metadata = {
  title: "Shipping Policy | Vishwakarma Gifts",
  description:
    "Vishwakarma Gifts shipping policy — domestic delivery across India, processing times, delivery timelines, and tracking information.",
  alternates: { canonical: "/shipping-policy" },
  openGraph: {
    title: "Shipping Policy | Vishwakarma Gifts",
    description:
      "Domestic shipping across India, processing within 2–4 business days, with tracking sent to your registered email.",
    url: "/shipping-policy",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function ShippingPolicyPage() {
  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-12 col-xl-12">

          <div className="policy-wrapper">

            <h2 className="text-center mb-5 policy-title">
              Shipping Policy
            </h2>

            <div className="policy-card mb-4">
              <h4 className="policy-heading">
                <i className="fas fa-truck me-2"></i>
                Domestic Shipping (India)
              </h4>
              <ul>
                <li>Shipped via trusted domestic couriers</li>
                <li>Delivered through India Speed Post</li>
                <li>Covering all PIN codes across India</li>
              </ul>
            </div>

            <div className="policy-card mb-4">
              <h4 className="policy-heading">Processing Time</h4>
              <ul>
                <li>Orders ship within 2–4 business days</li>
                <li>Custom engraving may take extra time</li>
                <li>Delivery date confirmed during processing</li>
              </ul>
            </div>

            <div className="policy-card mb-4">
              <h4 className="policy-heading">Delivery Timeline</h4>
              <ul>
                <li>Handed to courier within 2–4 working days</li>
                <li>Delivery depends on courier service</li>
                <li>Courier delays are beyond our control</li>
              </ul>
            </div>

            <div className="policy-footer text-center">
              <h5>Important Notes</h5>
              <p>Orders ship to checkout address only</p>
              <p>Tracking sent to registered email</p>

              <p className="mb-1">
                📞 <a href="tel:+918824942813">+91 8824942813</a>
              </p>
              <p>
                ✉️ <a href="mailto:giftsvishwakarma@gmail.com">
                  giftsvishwakarma@gmail.com
                </a>
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

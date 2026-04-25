import type { Metadata } from "next";
import "./terms.css";

export const metadata: Metadata = {
  title: "Terms of Service | Vishwakarma Gifts",
  description:
    "Read the Terms of Service for vishwakarmagifts.com — order policies, refunds, shipping, media requirements, and customer responsibilities.",
  alternates: { canonical: "/terms-and-service" },
  openGraph: {
    title: "Terms of Service | Vishwakarma Gifts",
    description:
      "Please read these terms carefully before using Vishwakarma Gifts services.",
    url: "/terms-and-service",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function TermsOfServicePage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-12 col-xl-12">

          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold theme-title mb-2">Terms of Service</h1>
            <p className="text-muted">Please read these terms carefully before using our services</p>
          </div>

          {/* Main Card */}
          <div className="card border-0 shadow-lg policy-wrapper">
            <div className="card-body p-5">

              <div className="theme-alert mb-5">
                <p className="mb-0">
                  By using vishwakarmagifts.com, you agree to comply with and be bound by the following terms and conditions.
                </p>
              </div>

              {/* 1. Introduction */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">1</span>
                  Introduction
                </h2>

                <p className="mt-3">
                  vishwakarmagifts.com is a gifting service provider operating throughout India. We reserve the right to accept or reject any order after verifying contact details.
                </p>

                <div className="policy-point">
                  <h4>Marketing &amp; Product Variations</h4>
                  <ul>
                    <li>Client images may be used for marketing unless objected to</li>
                    <li>Actual products may slightly vary from website images</li>
                    <li>Product specifications are approximate</li>
                    <li>Similar products may be substituted if required</li>
                  </ul>
                </div>

                <div className="policy-point">
                  <h4>Website Usage</h4>
                  <ul>
                    <li>Content is for personal, non-commercial use only</li>
                    <li>Unauthorized copying or distribution is prohibited</li>
                    <li>Prices and availability may change without notice</li>
                    <li>Sales to resellers may be limited</li>
                  </ul>
                </div>

                <div className="theme-alert">
                  <strong>Note:</strong> Due to time-sensitive gifting, previews may not be possible for all orders.
                </div>
              </div>

              {/* 2. Refund Policy */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">2</span>
                  Refund Policy
                </h2>

                <div className="policy-point">
                  <h4>Cancellation by Vishwakarma Gifts</h4>
                  <ul>
                    <li>Orders may be cancelled due to stock, pricing, or credit issues</li>
                    <li>Perishable items get one delivery attempt only</li>
                  </ul>
                </div>

                <div className="policy-point">
                  <h4>Cancellation by Customer</h4>
                  <ul>
                    <li>3% processing fee applies</li>
                    <li>Refunds processed in 7–10 working days</li>
                    <li>No refund after production or dispatch</li>
                    <li>Email: <a href="mailto:giftsvishwakarma@gmail.com">giftsvishwakarma@gmail.com</a></li>
                  </ul>
                </div>
              </div>

              {/* 3. Billing / Shipping */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">3</span>
                  Billing &amp; Shipping Details
                </h2>

                <ul>
                  <li>Contact us immediately for corrections</li>
                  <li>Changes allowed only before dispatch</li>
                  <li>Email: <a href="mailto:giftsvishwakarma@gmail.com">giftsvishwakarma@gmail.com</a></li>
                  <li>WhatsApp: +91 8824942813</li>
                </ul>
              </div>

              {/* 4. Media Requirements */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">4</span>
                  Media Requirements
                </h2>

                <div className="policy-point">
                  <h4>Photos / Images</h4>
                  <ul>
                    <li>Only HD quality images accepted</li>
                    <li>Follow product instructions carefully</li>
                    <li>No responsibility for poor image quality</li>
                    <li>No collages or mosaics</li>
                  </ul>
                </div>

                <div className="policy-point">
                  <h4>Messages / Text</h4>
                  <ul>
                    <li>Some symbols/emojis may not engrave</li>
                    <li>Products ship as-is if no message provided</li>
                    <li>Text printed exactly as submitted</li>
                  </ul>
                </div>
              </div>

              {/* 5. Product Addons */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">5</span>
                  Product Add-ons
                </h2>

                <ul>
                  <li>Final price may vary after processing</li>
                  <li>Add-ons default to quantity of one</li>
                  <li>Damaged add-ons will be replaced or refunded</li>
                </ul>
              </div>

              {/* 6. Legal */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">6</span>
                  Legal Terms
                </h2>

                <ul>
                  <li>Vishwakarma Gifts operates from Jaipur, Rajasthan</li>
                  <li>Not responsible for courier delays</li>
                </ul>
              </div>

              {/* 7. Customer Responsibilities */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">7</span>
                  Customer Responsibilities
                </h2>

                <ul>
                  <li>Provide accurate delivery details</li>
                  <li>Extra charges for incorrect information</li>
                  <li>Unboxing video required for damage claims</li>
                  <li>Report issues within 24 hours</li>
                </ul>
              </div>

              {/* 8. Product Complaints */}
              <div className="terms-section">
                <h2>
                  <span className="badge theme-badge me-3">8</span>
                  Product Complaints
                </h2>

                <ul>
                  <li>Unboxing video mandatory</li>
                  <li>Replacements take 10–15 days</li>
                  <li>No returns on used or damaged items</li>
                  <li>Email within 24 hours of delivery</li>
                </ul>
              </div>

              {/* Contact */}
              <div className="contact-box text-center mt-5 p-4 rounded">
                <h4>Need Assistance?</h4>
                <p>Email: <a href="mailto:giftsvishwakarma@gmail.com">giftsvishwakarma@gmail.com</a></p>
                <p>WhatsApp: +91 8824942813</p>
              </div>

              <div className="text-end mt-4">

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

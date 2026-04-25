import type { Metadata } from "next";
import "./returns.css";

export const metadata: Metadata = {
  title: "Refund Policy | Vishwakarma Gifts",
  description:
    "Cancellation and refund policy for Vishwakarma Gifts — order cancellation rules, processing times, and product complaint procedures.",
  alternates: { canonical: "/returns-policy" },
  openGraph: {
    title: "Refund Policy | Vishwakarma Gifts",
    description:
      "Our policies for cancellations and refunds — please read before placing your order.",
    url: "/returns-policy",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function ReturnsPolicyPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-12 col-xl-12">

          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold theme-title mb-2">Refund Policy</h1>
            <p className="text-muted">Our policies for cancellations and refunds</p>
          </div>

          {/* Main Card */}
          <div className="card border-0 shadow-lg policy-wrapper">
            <div className="card-body p-5">

              <div className="theme-alert mb-5">
                <p className="mb-0">
                  Please read this policy carefully before placing your order. This document outlines our cancellation and refund procedures.
                </p>
              </div>

              {/* Cancellation Policy */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">1</span>
                  Cancellation Policy
                </h2>

                <div className="policy-point">
                  <h4>Cancellation by Vishwakarma Gifts</h4>
                  <p>We reserve the right to cancel orders under certain circumstances, including:</p>
                  <ul>
                    <li>Product quantity limitations</li>
                    <li>Errors in product or pricing information</li>
                    <li>Credit department limitations</li>
                  </ul>
                  <p className="mt-2">
                    For perishable items, delivery is attempted only once. No refunds are possible if delivery fails due to incorrect address or recipient unavailability.
                  </p>
                </div>

                <div className="policy-point">
                  <h4>Cancellation by Customer</h4>
                  <ul>
                    <li>3% processing fee will be deducted from refunded amount</li>
                    <li>Refunds are processed within 7–10 working days</li>
                    <li>No refunds after production has started or order is dispatched</li>
                  </ul>
                  <p className="mt-2">
                    To cancel an order, email us at{" "}
                    <a href="mailto:giftsvishwakarma@gmail.com">giftsvishwakarma@gmail.com</a>
                  </p>

                  <div className="theme-alert mt-3">
                    <strong>Note:</strong> As all products are personalized, production begins shortly after order confirmation.
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">2</span>
                  Terms &amp; Conditions
                </h2>

                <div className="policy-point">
                  <h4>Customer Responsibilities</h4>
                  <ul>
                    <li>Extra delivery charges apply for returns due to incorrect address</li>
                    <li>We verify customer details and may reject incorrect requests</li>
                  </ul>
                </div>
              </div>

              {/* Product Complaints */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">3</span>
                  Product Complaints
                </h2>

                <div className="policy-point">
                  <ul>
                    <li>Unboxing video is mandatory for defective product claims</li>
                    <li>Replacements take 10–15 working days after receiving returned item</li>
                    <li>No returns for used, tampered, or damaged packaging</li>
                  </ul>
                  <p className="mt-2">
                    Please report issues within 24 hours of delivery to{" "}
                    <a href="mailto:giftsvishwakarma@gmail.com">giftsvishwakarma@gmail.com</a>
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="contact-box text-center mt-5 p-4 rounded">
                <h4>Need Help?</h4>
                <p className="mb-1">
                  Email:{" "}
                  <a href="mailto:giftsvishwakarma@gmail.com">
                    giftsvishwakarma@gmail.com
                  </a>
                </p>
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

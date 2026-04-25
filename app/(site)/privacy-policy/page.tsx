import type { Metadata } from "next";
import "./privacy.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Vishwakarma Gifts (My Loving Crafts) collects, uses, and protects your personal information when you shop with us.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: {
    title: "Privacy Policy | Vishwakarma Gifts",
    description:
      "How we collect, use, and protect your personal information at Vishwakarma Gifts.",
    url: "/privacy-policy",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-12 col-xl-12">
          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold theme-title mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted">Your privacy is important to us</p>
          </div>

          {/* Main Card */}
          <div className="card border-0 shadow-lg policy-wrapper">
            <div className="card-body p-5">
              <div className="theme-alert mb-5">
                <p className="mb-0 fs-6">
                  This Privacy Policy outlines how My Loving Crafts collects,
                  uses, and protects your personal information when you use our
                  website.
                </p>
              </div>

              {/* Information Collection */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">1</span>
                  Information Collection
                </h2>
                <p>
                  We automatically log technical information such as IP address,
                  browser type, and operating system to improve our services.
                  No personal information is collected without your consent.
                </p>
              </div>

              {/* Cookies */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">2</span>
                  Cookies Usage
                </h2>
                <p>
                  Our website uses cookies to enhance your shopping experience
                  and maintain session information. You may disable cookies in
                  your browser, though this may affect certain site features.
                </p>
              </div>

              {/* Communications */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">3</span>
                  Communications
                </h2>
                <p>
                  When you place an order, you will receive order and shipping
                  updates via email or SMS. Promotional emails may be sent
                  occasionally, and you may unsubscribe at any time. We never
                  share your contact details with third parties.
                </p>
              </div>

              {/* Member Data */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">4</span>
                  Member Data Protection
                </h2>
                <p>
                  Your personal information including name, address, and
                  contact details are kept confidential and are never sold,
                  rented, or shared with marketing agencies.
                </p>
              </div>

              {/* Security */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">5</span>
                  Security Measures
                </h2>
                <p>
                  We use industry-standard security measures to protect your
                  data. However, no online transmission or storage system can be
                  guaranteed to be 100% secure.
                </p>
              </div>

              {/* External Links */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">6</span>
                  External Links
                </h2>
                <p>
                  Our website may contain links to third-party websites. We are
                  not responsible for their privacy practices or content and
                  recommend reviewing their policies separately.
                </p>
              </div>

              {/* Updates */}
              <div className="policy-section">
                <h2>
                  <span className="badge theme-badge me-3">7</span>
                  Policy Updates
                </h2>
                <p>
                  This Privacy Policy may be updated periodically. Any changes
                  take effect immediately upon posting. We encourage you to
                  review this page regularly.
                </p>
              </div>

              {/* Footer (kept for parity with the Blade) */}
              <div className="text-end mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Vishwakarma Gifts — call, WhatsApp, email, or send us a message about custom wooden engraved gifts.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us | Vishwakarma Gifts",
    description:
      "Reach out to Vishwakarma Gifts for custom wooden engraved gifts, photo frames, and more.",
    url: "/contact",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-11 col-xl-10">
          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold theme-title mb-2">Contact Us</h1>
            <p className="text-muted">
              We&rsquo;d love to hear from you. Reach out to us anytime.
            </p>
          </div>

          {/* Main Card */}
          <div className="card border-0 shadow-lg policy-wrapper">
            <div className="card-body p-5">
              <div className="row g-4">
                {/* Contact Info */}
                <div className="col-md-5">
                  <div className="contact-box mb-4">
                    <i className="fas fa-phone-alt" />
                    <h4>Call Us</h4>
                    <p>
                      <a href="tel:+918824942813">+91 8824942813</a>
                    </p>
                  </div>

                  <div className="contact-box mb-4">
                    <i className="fas fa-envelope" />
                    <h4>Email Us</h4>
                    <p>
                      <a href="mailto:giftsvishwakarma@gmail.com">
                        giftsvishwakarma@gmail.com
                      </a>
                    </p>
                  </div>

                  <div className="contact-box">
                    <i className="fab fa-whatsapp" />
                    <h4>WhatsApp</h4>
                    <p>
                      <a
                        href="https://wa.me/918824942813"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        +91 8824942813
                      </a>
                    </p>
                  </div>
                </div>

                {/* Contact Form (client island) */}
                <div className="col-md-7">
                  <h3 className="mb-4 theme-subtitle">Send Us a Message</h3>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

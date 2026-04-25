import type { Metadata } from "next";
import "./about.css";

export const metadata: Metadata = {
  title: "About Us | Vishwakarma Gifts",
  description:
    "Vishwakarma Gifts crafts personalized, handcrafted gifts that celebrate life's special milestones — engraved keepsakes, wooden photo frames, and custom décor.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us | Vishwakarma Gifts",
    description:
      "Every Gift is a Story Waiting to be Told — discover the story behind Vishwakarma Gifts.",
    url: "/about",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-12 col-xl-12">

          {/* Page Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold theme-title mb-2">About Us</h1>
            <p className="lead text-muted">
              “Every Gift is a Story Waiting to be Told!”
            </p>
          </div>

          {/* Main Card */}
          <div className="card border-0 shadow-lg policy-wrapper">
            <div className="card-body p-5">

              <p className="fs-5 mb-4">
                Welcome to <strong>Vishwakarma Gifts</strong>, where every present is crafted to leave a lasting impression!
                Our mission is to provide personalized gifts that celebrate life’s special milestones and create meaningful connections.
              </p>

              <div className="about-section">
                <h2>Why Choose Vishwakarma Gifts?</h2>
                <p>
                  At Vishwakarma Gifts, we recognize that no two relationships are the same.
                  That’s why we offer thoughtfully designed gifts tailored for every celebration.
                  From birthdays and anniversaries to weddings and baby showers, our artisans
                  create items that are visually stunning and emotionally impactful.
                </p>
              </div>

              <div className="about-section">
                <h2>Gifts as Unique as Your Loved Ones</h2>
                <p>
                  Looking for a meaningful way to express love, appreciation, or gratitude?
                  We offer handcrafted items including engraved keepsakes, wooden photo frames,
                  and personalized décor — each designed to become a cherished memory.
                </p>
              </div>

              <div className="about-section">
                <h2>Unmatched Quality &amp; Craftsmanship</h2>
                <p>
                  Quality is the cornerstone of everything we do.
                  Using premium materials and advanced engraving techniques,
                  we ensure every product reflects elegance, durability, and fine craftsmanship.
                </p>
              </div>

              <div className="about-section">
                <h2>Reliable Delivery, Every Time</h2>
                <p>
                  We understand how important timely delivery is.
                  Whether planned in advance or ordered last-minute,
                  we ensure fast and dependable shipping so your gifts arrive on time.
                </p>
              </div>

              <div className="about-section">
                <h2>Memories That Last a Lifetime</h2>
                <p>
                  Personalized gifts create unforgettable moments.
                  At Vishwakarma Gifts, we’re honored to be part of your celebrations
                  and help turn special occasions into lifelong memories.
                </p>
              </div>

              {/* Closing */}
              <div className="theme-alert mt-4">
                <p className="mb-0">
                  Explore our unique collection today and experience the joy of giving with
                  {" "}<strong>Vishwakarma Gifts</strong>.
                </p>
              </div>

              {/* Contact */}
              <div className="contact-box text-center mt-5 p-4 rounded">
                <h4>Contact Us</h4>
                <p className="mb-1">
                  Email:{" "}
                  <a href="mailto:giftsvishwakarma@gmail.com">
                    giftsvishwakarma@gmail.com
                  </a>
                </p>
                <p className="mb-1">
                  Phone:{" "}
                  <a href="tel:+918824942813">+91 8824942813</a>
                </p>
                <p className="mt-2 fw-semibold">
                  Vishwakarma Gifts — Crafted to Celebrate Life’s Precious Moments 🎁
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

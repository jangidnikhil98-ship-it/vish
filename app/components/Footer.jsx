"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./homepage.css"; // Ensure footer styles are loaded

export default function Footer() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.AOS) {
      window.AOS.init();
    }
  }, []);

  return (
    <footer className="hp-footer">
      <div className="container">
        <div className="hp-footer-grid">
          
          {/* Brand & Social */}
          <div className="hp-footer-brand">
            <Link href="/">
              <img
                src="/img/logo.svg"
                alt="Vishwakarma Gifts"
                className="hp-footer-logo"
                loading="lazy"
              />
            </Link>
            <p className="hp-footer-desc">
              Crafting timeless memories with premium personalized wooden gifts. Celebrate your special moments with our elegant and eco-friendly creations, delivered across India.
            </p>
            <div className="hp-footer-social">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="hp-footer-title">Shop</h4>
            <ul className="hp-footer-links">
              <li><Link href="/products?type=bestseller">Bestsellers</Link></li>
              <li><Link href="/products?type=birthday">Birthday Gifts</Link></li>
              <li><Link href="/products?type=wedding-anniversary">Anniversary Gifts</Link></li>
              <li><Link href="/products?type=corporate-gifts">Corporate Gifts</Link></li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h4 className="hp-footer-title">Important Links</h4>
            <ul className="hp-footer-links">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/returns-policy">Returns Policy</Link></li>
              <li><Link href="/shipping-policy">Shipping Policy</Link></li>
              <li><Link href="/terms-and-service">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="hp-footer-title">Contact Us</h4>
            <ul className="hp-footer-links hp-footer-contact">
              <li>
                <i className="fab fa-whatsapp"></i>
                <a href="tel:+918824942813">+91 8824942813</a>
              </li>
              <li>
                <i className="fas fa-envelope"></i>
                <a href="mailto:giftsvishwakarma@gmail.com">giftsvishwakarma@gmail.com</a>
              </li>
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <span>Jaipur, Rajasthan – 302013</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="hp-footer-bottom">
          <p>© {new Date().getFullYear()} Vishwakarma Gifts. All Rights Reserved. Crafted with love in India.</p>
        </div>
      </div>
    </footer>
  );
}
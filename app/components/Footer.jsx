"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Footer() {
  useEffect(() => {
    // AOS init (if installed)
    if (typeof window !== "undefined" && window.AOS) {
      window.AOS.init();
    }

    // Menu toggle
    const menu = document.getElementById("menu-toggle");
    if (menu) {
      menu.addEventListener("click", () => {
        document.getElementById("nav")?.classList.toggle("show");
      });
    }

    // Typewriter effect
    const text = "Choose Perfect\nGifts From Us";
    const target = document.querySelector(".typewriter-text");

    if (!target) return;

    let index = 0;
    let isDeleting = false;

    function typeWriter() {
      if (!isDeleting) {
        const char = text.charAt(index);
        target.innerHTML += char === "\n" ? "<br>" : char;
        index++;

        if (index <= text.length) {
          setTimeout(typeWriter, 80);
        } else {
          setTimeout(() => {
            isDeleting = true;
            typeWriter();
          }, 1500);
        }
      } else {
        const currentText = target.innerText;
        target.innerHTML = currentText.slice(0, -1).replace("\n", "<br>");

        if (index > 0) {
          index--;
          setTimeout(typeWriter, 50);
        } else {
          isDeleting = false;
          setTimeout(typeWriter, 500);
        }
      }
    }

    typeWriter();
  }, []);

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="row footer-content mb-3">
            
            {/* Important Links */}
            <div className="col-md-4 footer-section">
              <h4>Important Links</h4>
              <ul>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/returns-policy">Returns Policy</Link></li>
                <li><Link href="/terms-and-service">Terms of Service</Link></li>
                <li><Link href="/shipping-policy">Shipping Policy</Link></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="col-md-4 footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/about">About Store</Link></li>
                <li><Link href="/blogs">Blogs</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-md-4 footer-section footer-contact contact-info">
              <h4>Contact Us</h4>
              <ul className="footer-contact-list">
                <li>
                  <i className="fab fa-whatsapp" aria-hidden="true" />
                  <a href="tel:+918824942813">+91 8824942813</a>
                </li>
                <li>
                  <i className="fas fa-envelope" aria-hidden="true" />
                  <a href="mailto:giftsvishwakarma@gmail.com">
                    giftsvishwakarma@gmail.com
                  </a>
                </li>
                <li>
                  <i className="fas fa-map-marker-alt" aria-hidden="true" />
                  <span>Jaipur, Rajasthan – 302013</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom */}
          <div className="row footer-bottom border-top pt-3 text-center">
            <div className="col-12">
              <p style={{ color: "white" }}>
                © {new Date().getFullYear()}, Vishwakarma Gifts All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
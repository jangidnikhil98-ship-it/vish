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
          <div className="row footer-content mb-5">
            
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
            <div className="col-md-4 footer-section contact-info">
              <h4>Contact Information</h4>
              <p>
                <strong>Vishwakarma Gifts</strong> specializes in crafting unique,
                personalized gifts that express your love and make relationships stronger.
              </p>
              <p>
                <strong>Whatsapp :</strong>{" "}
                <a href="tel:+918824942813">+91 8824942813</a>
              </p>
              <p>
                <strong>Email :</strong>{" "}
                <a href="mailto:giftsvishwakarma@gmail.com">
                  giftsvishwakarma@gmail.com
                </a>
              </p>
              <p><strong>Jaipur, Rajasthan – 302013</strong></p>
            </div>

          </div>

          {/* Bottom */}
          <div className="row footer-bottom border-top pt-4 text-center">
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
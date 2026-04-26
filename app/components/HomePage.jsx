"use client";

import { useEffect } from "react";
import Link from "next/link";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

const testimonials = [
  {
    name: "Bhanu Jangid",
    image: "/img/bhanu.webp",
    text: "“I ordered a custom wooden engraved photo frame from Vishwakarma Gifts and the quality exceeded my expectations. The engraving was clean, the wood finish was premium, and delivery was on time. One of the best websites for personalized wooden gifts in India.”",
  },
  {
    name: "Krishan Kumawat",
    image: "/img/krish.webp",
    text: "“Vishwakarma Gifts offers beautiful customized wooden engraving gifts. I ordered a name-engraved wooden plaque and it looked elegant and classy. Perfect for gifting on birthdays and special occasions.”",
  },
  {
    name: "Abhishek",
    image: "/img/abhi.webp",
    text: "“I surprised my wife with a personalized wooden photo frame from Vishwakarma Gifts. The detailing was outstanding and the product felt premium. Fast delivery and great packaging. Highly recommended!”",
  },
  {
    name: "Abhi",
    image: "/img/abhi1.webp",
    text: "“I ordered multiple products including a personalized wooden keychain and photo stand. The craftsmanship was excellent and the engraving was very precise. Vishwakarma Gifts is now my favorite store for custom wooden gifts online.”",
  },
  {
    name: "Ankit",
    image: "/img/ankit.webp",
    text: "“Searching for a reliable site for custom wooden engraved gifts, I found Vishwakarma Gifts. Easy customization, smooth checkout, and timely delivery across India. Totally satisfied with my purchase.”",
  },
  {
    name: "Chinnu",
    image: "/img/sachin.webp",
    text: "“The personalized wooden gift from Vishwakarma Gifts was beautifully crafted. The eco-friendly wooden material and neat engraving made it a perfect gift for birthdays and festivals.”",
  },
  {
    name: "Hemant",
    image: "/img/hema.webp",
    text: "“Excellent service and premium quality products. The team at Vishwakarma Gifts helped me with customization and delivered exactly what I wanted. Best personalized gift store in India.”",
  },
];

/**
 * @typedef {Object} Bestseller
 * @property {string} slug
 * @property {string} name
 * @property {string} image
 * @property {number} price
 * @property {number} finalPrice
 */

/**
 * @param {{ bestsellers?: Bestseller[] }} props
 */
export default function HomePage({ bestsellers = [] }) {
  useEffect(() => {
    let aosTries = 0;
    let owlTries = 0;

    const initAOS = () => {
      if (typeof window === "undefined") return;
      if (window.AOS) {
        window.AOS.init({ once: true, disable: "mobile" });
      } else if (aosTries++ < 40) {
        setTimeout(initAOS, 150);
      }
    };

    const initOwl = () => {
      if (typeof window === "undefined") return;
      const $ = window.jQuery;
      if ($ && typeof $.fn?.owlCarousel === "function") {
        const initCarousel = (selector, itemsDesktop) => {
          const el = $(selector);
          if (el.length && !el.hasClass("owl-loaded")) {
            el.owlCarousel({
              loop: true,
              margin: 10,
              nav: true,
              dots: true,
              autoplay: true,
              autoplayTimeout: 3000,
              autoplayHoverPause: true,
              touchDrag: true,
              mouseDrag: true,
              responsive: {
                0: { items: 1 },
                600: { items: 2 },
                1000: { items: itemsDesktop },
              },
            });
          }
        };
        initCarousel(".owl-carousel5", 4);
        initCarousel(".owl-carousel2", 3);
      } else if (owlTries++ < 40) {
        setTimeout(initOwl, 150);
      }
    };

    initAOS();
    initOwl();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero-banner">
        <div
          id="carouselExampleCaptions"
          className="carousel slide"
          data-bs-ride="carousel"
          data-bs-interval="3000"
        >
          <div className="carousel-indicators">
            <button
              type="button"
              data-bs-target="#carouselExampleCaptions"
              data-bs-slide-to="0"
              className="active"
              aria-current="true"
              aria-label="Slide 1"
            ></button>
            <button
              type="button"
              data-bs-target="#carouselExampleCaptions"
              data-bs-slide-to="1"
              aria-label="Slide 2"
            ></button>
            <button
              type="button"
              data-bs-target="#carouselExampleCaptions"
              data-bs-slide-to="2"
              aria-label="Slide 3"
            ></button>
          </div>
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img
                src="/img/banner.webp"
                className="d-block w-100"
                alt="Personalized Wooden Gifts"
                fetchPriority="high"
              />
              <div className="carousel-caption ">
                <span>Choose the Perfect Personalized Wooden Gifts</span>
                <h5>
                  Create lasting memories with custom <br /> wooden engraved
                  gifts
                </h5>
                <p>
                  Shop beautifully handcrafted personalized wooden photo frames,
                  plaques, and unique gifts <br /> for birthdays, weddings,
                  anniversaries, and special occasions.
                </p>
                <Link
                  href="/products/customizable-engraved-on-wood-photo-frame-round-shape"
                  className="hero-shop-btn"
                >
                  <button>Shop Now</button>
                </Link>
              </div>
            </div>
            <div className="carousel-item">
              <img
                src="/img/banner.webp"
                className="d-block w-100"
                alt="Personalized Wooden Gifts"
              />
              <div className="carousel-caption ">
                <span>Choose the Perfect Personalized Wooden Gifts</span>
                <h5>
                  Create lasting memories with custom <br /> wooden engraved
                  gifts
                </h5>
                <p>
                  Shop beautifully handcrafted personalized wooden photo frames,
                  plaques, and unique gifts <br /> for birthdays, weddings,
                  anniversaries, and special occasions.
                </p>
                <Link
                  href="/products/customizable-engraved-on-wood-photo-frame-round-shape"
                  className="hero-shop-btn"
                >
                  <button>Shop Now</button>
                </Link>
              </div>
            </div>
            <div className="carousel-item">
              <img
                src="/img/banner.webp"
                className="d-block w-100"
                alt="Personalized Wooden Gifts"
              />
              <div className="carousel-caption ">
                <span>Choose the Perfect Personalized Wooden Gifts</span>
                <h5>
                  Create lasting memories with custom <br /> wooden engraved
                  gifts
                </h5>
                <p>
                  Shop beautifully handcrafted personalized wooden photo frames,
                  plaques, and unique gifts <br /> for birthdays, weddings,
                  anniversaries, and special occasions.
                </p>
                <Link
                  href="/products/customizable-engraved-on-wood-photo-frame-round-shape"
                  className="hero-shop-btn"
                >
                  <button>Shop Now</button>
                </Link>
              </div>
            </div>
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleCaptions"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleCaptions"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </section>

      {/* SHIPPING / FEATURES STRIP */}
      <div className="shipping-system">
        <section className="shipping-categry">
          <div className="container">
            <div className="row">
              <div className="col-md-3">
                <div className="safe-payment">
                  <img
                    src="/img/free-shiping.svg"
                    className="img-fluid"
                    alt="free"
                  />
                  <h2>Free Delivery</h2>
                  <p>Orders Over 299</p>
                </div>
              </div>

              <div className="col-md-3">
                <div className="safe-payment">
                  <img src="/img/refund.svg" className="img-fluid" alt="free" />
                  <h2>Get Refund</h2>
                  <p>Within 7 Days Returns</p>
                </div>
              </div>

              <div className="col-md-3">
                <div className="safe-payment">
                  <img
                    src="/img/safe-payment.svg"
                    className="img-fluid"
                    alt="free"
                  />
                  <h2>Safe Payment</h2>
                  <p>100% Secure Payment</p>
                </div>
              </div>

              <div className="col-md-3">
                <div className="safe-payment">
                  <img
                    src="/img/support.svg"
                    className="img-fluid"
                    alt="free"
                  />
                  <h2>24/7 Support</h2>
                  <p>Feel Free To Call Us</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CATEGORY */}
      <section className="category-section our-category-portrait py-5">
        <div className="container">
          <div className="our-catgery-heading">
            <h2>
              Our Category <span></span>{" "}
            </h2>
          </div>
          <div className="row text-center justify-content-center g-4 category-slider">
            <div
              className="col-12 col-sm-4 col-md-3 col-lg-3"
              data-aos="fade-up"
              data-aos-duration="500"
            >
              <div className="category-item">
                <Link href="/products?type=birthday">
                  <img
                    src="/img/brithday.webp"
                    alt="Birthday"
                    loading="lazy"
                  />
                  <p>Birthday</p>
                </Link>
              </div>
            </div>
            <div
              className="col-12 col-sm-4 col-md-3 col-lg-3"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              <div className="category-item">
                <Link href="/products?type=bestseller">
                  <img
                    src="/img/manichurimage.webp"
                    alt="Miniature Frame"
                    loading="lazy"
                  />
                  <p>Miniature Frame</p>
                </Link>
              </div>
            </div>
            <div
              className="col-12 col-sm-4 col-md-3 col-lg-3"
              data-aos="fade-up"
              data-aos-duration="700"
            >
              <div className="category-item">
                <Link href="/products?type=wedding-anniversary">
                  <img
                    src="/img/anniversyimag.webp"
                    alt="Wedding & Anniversary"
                    loading="lazy"
                  />
                  <p>Wedding &amp; Anniversary</p>
                </Link>
              </div>
            </div>
            <div
              className="col-12 col-sm-4 col-md-3 col-lg-3"
              data-aos="fade-up"
              data-aos-duration="800"
            >
              <div className="category-item">
                <Link href="/products?type=mothers-day">
                  <img
                    src="/img/gift-image.webp"
                    alt="Mother's Day"
                    loading="lazy"
                  />
                  <p>Mother&apos;s Day</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / ABOUT */}
      <section className="why-chooseus">
        <div className="container">
          <div className="row">
            <div
              className="col-md-6"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              <div className="there-many">
                <img src="/img/about.webp" className="img-fluid" alt="many" />
              </div>
            </div>
            <div
              className="col-md-6"
              data-aos="fade-up"
              data-aos-duration="500"
            >
              <div className="proud-premium">
                <h6>About Vishwakarma Gifts</h6>
                <p>
                  Vishwakarma Gifts is a trusted online destination for
                  personalized wooden engraved gifts in India, crafted with
                  care, creativity, and precision. We specialize in custom
                  wooden photo frames, engraved wooden plaques, name boards,
                  keychains, and unique gifting solutions designed to turn
                  special moments into lifelong memories.
                  <br />
                  <br />
                  Each product at Vishwakarma Gifts is handcrafted using
                  premium-quality wood and customized with advanced engraving
                  techniques to ensure fine detailing and long-lasting finish.
                  Whether it&apos;s a birthday, wedding, anniversary,
                  Mother&apos;s Day, or a special occasion, our personalized
                  wooden gifts add a warm and emotional touch to every
                  celebration.
                  <br />
                  <br />
                  We believe that gifts should be meaningful, eco-friendly, and
                  timeless. That&apos;s why our wooden engraved products are
                  thoughtfully designed to reflect love, emotions, and
                  individuality. With easy customization, secure online
                  payments, and reliable delivery across India, Vishwakarma
                  Gifts makes personalized gifting simple and special.
                  <br />
                  <br />
                  Choose Vishwakarma Gifts to celebrate your moments with
                  beautifully crafted customized wooden gifts that speak from
                  the heart.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="category-section Bestsaller_section py-5">
        <div className="container">
          <div className="our-catgery-heading alltimebest">
            <h2>
              All Time Bestsellers <span></span>
            </h2>

            <Link href="/products?type=bestseller" className="view-all-btn">
              View All Bestsellers
            </Link>
          </div>

          <div className="row text-center justify-content-center g-4">
            {bestsellers.length > 0 ? (
              bestsellers.map((product) => (
                <div
                  key={product.slug}
                  className="col-6 col-sm-4 col-md-3 col-lg-3"
                >
                  <div className="category-item-annivesary">
                    <Link href={`/products/${product.slug}`}>
                      <div className="birthday-item">
                        <img
                          loading="lazy"
                          src={product.image}
                          className="default-img"
                          alt={product.name}
                          width="300"
                          height="300"
                        />
                      </div>
                    </Link>

                    <div className="artificial-engvraed">
                      <Link href={`/products/${product.slug}`}>
                        <p>{product.name}</p>

                        <div className="product-price">
                          <h2>₹{formatINR(product.finalPrice)}</h2>
                          {product.price && product.price > product.finalPrice ? (
                            <h6>₹{formatINR(product.price)}</h6>
                          ) : null}
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No products found.</p>
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonails secP">
        <div className="container">
          <div className="premium-domainheading mb-2">
            <p>Testimonials</p>
            <h2>
              {" "}
              People&rsquo;s Say About Our <br />
              Gifts <span></span>
            </h2>
          </div>
          <div className="owl-carousel owl-theme owl-carousel2">
            {testimonials.map((t, i) => (
              <div className="item" key={i}>
                <div className="testimonails-slider">
                  <div className="bcd-slider">
                    <div className="client-images">
                      <img src={t.image} className="img-fluid" alt="client" />
                    </div>
                    <div className="profile-name-t">
                      <h6>{t.name}</h6>
                    </div>
                  </div>

                  <p>{t.text}</p>
                  <div className="client-name">
                    <div className="rating-review">
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                    </div>
                    <div className="profile-name">
                      <img
                        src="/img/quote.svg"
                        className="img-fluid"
                        alt="quote"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

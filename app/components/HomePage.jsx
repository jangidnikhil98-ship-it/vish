"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import "./homepage.css";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

const testimonials = [
  {
    name: "Bhanu Jangid",
    image: "/img/bhanu.webp",
    text: "“I ordered a custom wooden engraved photo frame from Vishwakarma Gifts and the quality exceeded my expectations. The engraving was clean, the wood finish was premium, and delivery was on time.”",
    rating: 5,
  },
  {
    name: "Krishan Kumawat",
    image: "/img/krish.webp",
    text: "“Vishwakarma Gifts offers beautiful customized wooden engraving gifts. I ordered a name-engraved wooden plaque and it looked elegant and classy. Perfect for gifting.”",
    rating: 5,
  },
  {
    name: "Abhishek",
    image: "/img/abhi.webp",
    text: "“I surprised my wife with a personalized wooden photo frame from Vishwakarma Gifts. The detailing was outstanding and the product felt premium. Highly recommended!”",
    rating: 5,
  },
  {
    name: "Abhi",
    image: "/img/abhi1.webp",
    text: "“I ordered multiple products including a personalized wooden keychain and photo stand. The craftsmanship was excellent and the engraving was very precise.”",
    rating: 4,
  },
  {
    name: "Ankit",
    image: "/img/ankit.webp",
    text: "“Searching for a reliable site for custom wooden engraved gifts, I found Vishwakarma Gifts. Easy customization, smooth checkout, and timely delivery across India.”",
    rating: 5,
  },
];

const occasions = [
  { name: "Birthday", image: "/img/brithday.webp", link: "/products?type=birthday" },
  { name: "Anniversary", image: "/img/anniversyimag.webp", link: "/products?type=wedding-anniversary" },
  { name: "Corporate", image: "/img/gift-image.webp", link: "/products?type=corporate-gifts" },
];

/**
 * @typedef {Object} Bestseller
 * @property {number} id
 * @property {string | null} slug
 * @property {string} name
 * @property {string} image
 * @property {number} price
 * @property {number} finalPrice
 */

/**
 * @param {{ bestsellers?: Bestseller[] }} props
 */
export default function HomePage({
  bestsellers = [],
  newArrivals = [],
  categories = [],
  banners = [],
  aboutHeading = "About Vishwakarma Gifts",
  aboutContent = "",
  reels = [],
  workshopVideo = {
    thumbnailUrl: "/img/workshop.webp",
    videoUrl: "",
    subtitle: "BEHIND THE CRAFT",
    title: "Two minutes inside\nour workshop."
  }
}) {
  useEffect(() => {
    let aosTries = 0;
    let bsTries = 0;

    const initAOS = () => {
      if (typeof window === "undefined") return;
      if (window.AOS) {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        window.AOS.init({
          once: true,
          duration: 700,
          easing: "ease-out-cubic",
          offset: 60,
          disable: reduce,
        });
      } else if (aosTries++ < 40) {
        setTimeout(initAOS, 150);
      }
    };

    let heroIntervalId = null;
    const heroEl = document.getElementById("carouselExampleCaptions");

    const goNextSlide = () => {
      if (!heroEl) return;
      const bs = window.bootstrap;
      if (bs && bs.Carousel) {
        const inst = bs.Carousel.getOrCreateInstance(heroEl, {
          interval: false,
          touch: false,
          ride: false,
          wrap: true,
        });
        inst.next();
      } else {
        const nextBtn = heroEl.querySelector(".carousel-control-next");
        if (nextBtn) nextBtn.click();
      }
    };

    const goPrevSlide = () => {
      if (!heroEl) return;
      const bs = window.bootstrap;
      if (bs && bs.Carousel) {
        const inst = bs.Carousel.getOrCreateInstance(heroEl, {
          interval: false,
          touch: false,
          ride: false,
          wrap: true,
        });
        inst.prev();
      } else {
        const prevBtn = heroEl.querySelector(".carousel-control-prev");
        if (prevBtn) prevBtn.click();
      }
    };

    const startHeroAutoplay = () => {
      if (!heroEl || heroIntervalId) return;
      heroIntervalId = setInterval(goNextSlide, 4000);
    };

    const initHeroCarousel = () => {
      if (typeof window === "undefined" || !heroEl) return;
      const bs = window.bootstrap;
      if (bs && bs.Carousel) {
        bs.Carousel.getOrCreateInstance(heroEl, {
          interval: false,
          touch: false,
          ride: false,
          wrap: true,
        });
        startHeroAutoplay();
      } else if (bsTries++ < 60) {
        setTimeout(initHeroCarousel, 150);
      } else {
        startHeroAutoplay();
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    };
    const onTouchEnd = (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNextSlide();
        else goPrevSlide();
      }
    };
    if (heroEl) {
      heroEl.addEventListener("touchstart", onTouchStart, { passive: true });
      heroEl.addEventListener("touchend", onTouchEnd, { passive: true });
    }

    initAOS();
    initHeroCarousel();

    return () => {
      if (heroIntervalId) clearInterval(heroIntervalId);
      if (heroEl) {
        heroEl.removeEventListener("touchstart", onTouchStart);
        heroEl.removeEventListener("touchend", onTouchEnd);
      }
    };
  }, []);

  const finalBanners = banners.length > 0 ? banners : [
    {
      image: "/img/banner.webp",
      span: "Choose the Perfect Personalized Wooden Gifts",
      title: "Create lasting memories with custom wooden gifts",
      description: "Shop beautifully handcrafted personalized wooden photo frames, plaques, and unique gifts.",
      link: "/products/customizable-engraved-on-wood-photo-frame-round-shape"
    },
    {
      image: "/img/banner2.webp",
      span: "Premium Personalized Corporate Gifting Solutions",
      title: "Custom Engraved Corporate Gift Sets",
      description: "Impress your clients and team with custom-branded smart bottles, executive diaries, and pens.",
      link: "/products?type=corporate-gifts"
    }
  ];

  return (
    <div className="hp-container">
      {/* 1. HERO SECTION */}
      <section className="hp-hero">
        <div id="carouselExampleCaptions" className="carousel slide carousel-fade">
          <div className="carousel-indicators">
            {finalBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                data-bs-target="#carouselExampleCaptions"
                data-bs-slide-to={idx}
                className={idx === 0 ? "active" : ""}
                aria-current={idx === 0 ? "true" : undefined}
                aria-label={`Slide ${idx + 1}`}
              ></button>
            ))}
          </div>
          <div className="carousel-inner">
            {finalBanners.map((b, idx) => (
              <div key={idx} className={`carousel-item ${idx === 0 ? "active" : ""}`}>
                <Image
                  src={b.image}
                  className="d-block w-100"
                  alt={b.span || "Banner slide"}
                  width={1920}
                  height={800}
                  priority={idx === 0}
                />
                <div className="hp-hero-overlay">
                  <div className="container">
                    <div className="hp-hero-content" data-aos="fade-up">
                      <span className="hp-hero-subtitle">{b.span}</span>
                      <h1 className="hp-hero-title hp-heading">
                        {b.title.split(/<br\s*\/?>|\\n|\n/i).map((line, lineIdx) => (
                          <span key={lineIdx}>
                            {line}
                            {lineIdx < b.title.split(/<br\s*\/?>|\\n|\n/i).length - 1 && <br />}
                          </span>
                        ))}
                      </h1>
                      <p className="hp-hero-desc">
                        {b.description.split(/<br\s*\/?>|\\n|\n/i).map((line, lineIdx) => (
                          <span key={lineIdx}>
                            {line}
                            {lineIdx < b.description.split(/<br\s*\/?>|\\n|\n/i).length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                      <div className="hp-hero-actions">
                        <Link href={b.link} className="hp-btn hp-btn-primary">
                          Shop Gifts
                        </Link>
                        <Link href="/products" className="hp-btn hp-btn-outline">
                          Explore Collections
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-control-prev d-none" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next d-none" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section className="hp-trust">
        <div className="container">
          <div className="row g-4">
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="0">
              <div className="hp-trust-item">
                <div className="hp-trust-icon"><i className="fa-solid fa-truck-fast"></i></div>
                <div className="hp-trust-title">Free Delivery</div>
                <div className="hp-trust-desc">Orders Over ₹299</div>
              </div>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="100">
              <div className="hp-trust-item">
                <div className="hp-trust-icon"><i className="fa-solid fa-rotate-left"></i></div>
                <div className="hp-trust-title">Easy Returns</div>
                <div className="hp-trust-desc">Within 7 Days</div>
              </div>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="200">
              <div className="hp-trust-item">
                <div className="hp-trust-icon"><i className="fa-solid fa-shield-halved"></i></div>
                <div className="hp-trust-title">Secure Payment</div>
                <div className="hp-trust-desc">100% Safe Checkout</div>
              </div>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="300">
              <div className="hp-trust-item">
                <div className="hp-trust-icon"><i className="fa-solid fa-headset"></i></div>
                <div className="hp-trust-title">24/7 Support</div>
                <div className="hp-trust-desc">Always Here To Help</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUICK CATEGORY NAVIGATION */}
      <section className="hp-categories hp-section">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">Explore by Category</h2>
            <p className="hp-section-subtitle">Find the perfect gift for every special moment</p>
          </div>
          <div className="hp-cat-grid">
            {categories.slice(0, 8).map((cat, idx) => (
              <Link
                key={idx}
                href={`/products?type=${cat.type}`}
                className="hp-cat-card"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div className="hp-cat-img-wrapper">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={400}
                    height={300}
                    loading="lazy"
                  />
                </div>
                <div className="hp-cat-name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED COLLECTIONS (Using newArrivals) */}
      <section className="hp-featured hp-section">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">Featured Collections</h2>
            <p className="hp-section-subtitle">Handpicked selections to inspire your gifting</p>
          </div>
          <div className="hp-featured-grid">
            {newArrivals.slice(0, 3).map((product, idx) => (
              <Link
                key={product.id}
                href={product.slug ? `/products/${product.slug}` : "/products"}
                className={`hp-featured-card ${idx === 0 ? "large" : ""}`}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <img src={product.image} alt={product.name} loading="lazy" />
                <div className="hp-featured-overlay">
                  <h3 className="hp-featured-title hp-heading">{product.name}</h3>
                  <div className="hp-featured-link">
                    Shop Now <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BEST SELLERS */}
      <section className="hp-bestsellers hp-section">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">Bestselling Gifts</h2>
            <p className="hp-section-subtitle">Our most loved personalized creations</p>
          </div>
          <div className="hp-product-grid">
            {bestsellers.slice(0, 8).map((product, idx) => (
              <Link
                key={product.id}
                href={product.slug ? `/products/${product.slug}` : "/products"}
                className="hp-product-card"
                data-aos="fade-up"
                data-aos-delay={(idx % 4) * 100}
              >
                <div className="hp-product-img-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <div className="hp-quick-view">Quick View</div>
                </div>
                <div className="hp-product-info">
                  <h3 className="hp-product-title">{product.name}</h3>
                  <div className="hp-product-rating">
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                  </div>
                  <div className="hp-product-price-wrap">
                    <span className="hp-price-final">₹{formatINR(product.finalPrice)}</span>
                    {product.price && product.price > product.finalPrice && (
                      <span className="hp-price-old">₹{formatINR(product.price)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-5" data-aos="fade-up">
            <Link href="/products?type=bestseller" className="hp-btn hp-btn-outline">
              View All Bestsellers
            </Link>
          </div>
        </div>
      </section>

      {/* 6. OCCASION-BASED SHOPPING */}
      <section className="hp-occasions hp-section">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">Shop By Occasion</h2>
            <p className="hp-section-subtitle">Thoughtful gifts for every milestone</p>
          </div>
          <div className="hp-occ-grid">
            {occasions.map((occ, idx) => (
              <Link key={idx} href={occ.link} className="hp-occ-card" data-aos="fade-up" data-aos-delay={idx * 100}>
                <img src={occ.image} alt={`${occ.name} Gifts`} loading="lazy" />
                <div className="hp-occ-overlay"></div>
                <div className="hp-occ-content">
                  <h3 className="hp-occ-title">{occ.name} Gifts</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WORKSHOP VIDEO SECTION */}
      {workshopVideo && (
        <section className="hp-workshop-video hp-section">
          <div className="container">
            <div className="hp-video-card" data-aos="fade-up">
              <div className="hp-video-thumbnail">
                <img src={workshopVideo.thumbnailUrl} alt={workshopVideo.title.replace(/\n/g, ' ')} loading="lazy" />
                <div className="hp-video-overlay">
                  <button className="hp-video-play-btn" aria-label="Play video">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="hp-video-info">
                    <span className="hp-video-subtitle">{workshopVideo.subtitle}</span>
                    <h2 className="hp-video-title hp-heading">
                      {workshopVideo.title.split(/<br\s*\/?>|\\n|\n/i).map((line, lineIdx) => (
                        <span key={lineIdx}>
                          {line}
                          {lineIdx < workshopVideo.title.split(/<br\s*\/?>|\\n|\n/i).length - 1 && <br />}
                        </span>
                      ))}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. WHY CHOOSE US */}
      <section className="hp-whyus hp-section">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">The Vishwakarma Promise</h2>
            <p className="hp-section-subtitle">Why thousands trust us with their memories</p>
          </div>
          <div className="hp-why-grid">
            <div className="hp-why-card" data-aos="fade-up" data-aos-delay="0">
              <i className="fa-solid fa-tree"></i>
              <h3 className="hp-why-title">Premium Wood</h3>
              <p className="hp-why-desc">We source only the finest, eco-friendly materials for a luxurious, lasting finish.</p>
            </div>
            <div className="hp-why-card" data-aos="fade-up" data-aos-delay="100">
              <i className="fa-solid fa-pen-nib"></i>
              <h3 className="hp-why-title">Precision Engraving</h3>
              <p className="hp-why-desc">State-of-the-art techniques guarantee flawless detailing on every piece.</p>
            </div>
            <div className="hp-why-card" data-aos="fade-up" data-aos-delay="200">
              <i className="fa-solid fa-heart"></i>
              <h3 className="hp-why-title">Handcrafted with Love</h3>
              <p className="hp-why-desc">Each item is individually crafted and inspected to ensure perfection.</p>
            </div>
            <div className="hp-why-card" data-aos="fade-up" data-aos-delay="300">
              <i className="fa-solid fa-gift"></i>
              <h3 className="hp-why-title">Elegant Packaging</h3>
              <p className="hp-why-desc">Your gifts arrive beautifully boxed, ready to impress the recipient immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TRENDING PICKS (Using remaining newArrivals) */}
      <section className="hp-featured hp-section">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">Trending Now</h2>
            <p className="hp-section-subtitle">What others are gifting right now</p>
          </div>
          <div className="hp-product-grid">
            {newArrivals.slice(3, 7).map((product, idx) => (
              <Link
                key={product.id}
                href={product.slug ? `/products/${product.slug}` : "/products"}
                className="hp-product-card"
                data-aos="fade-up"
                data-aos-delay={(idx % 4) * 100}
              >
                <div className="hp-product-img-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <div className="hp-quick-view">Quick View</div>
                </div>
                <div className="hp-product-info">
                  <h3 className="hp-product-title">{product.name}</h3>
                  <div className="hp-product-price-wrap">
                    <span className="hp-price-final">₹{formatINR(product.finalPrice)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9.5 INSTAGRAM REELS (Placeholder) */}
      <section className="hp-instagram hp-section">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">Follow Us On Instagram</h2>
            <p className="hp-section-subtitle">@vishwakarmagifts - Join our community of gift lovers</p>
          </div>
          <div className="hp-insta-grid" data-aos="fade-up" data-aos-delay="100">
            {reels.length > 0 ? (
              reels.map((reel, idx) => (
                <a key={reel.id || idx} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="hp-insta-card" style={{ display: 'block', overflow: 'hidden', position: 'relative', aspectRatio: '1/1' }}>
                  <video 
                    src={reel.media_url} 
                    poster={reel.thumbnail_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                  <div className="hp-insta-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                    <i className="fa-brands fa-instagram text-white" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                </a>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="hp-insta-card">
                  <div className="hp-insta-placeholder">
                    <i className="fa-brands fa-instagram"></i>
                    <p>Instagram Reel {i}</p>
                    <span>(Integration ready)</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-5" data-aos="fade-up">
            <a href="https://instagram.com/vishwakarmagifts" target="_blank" rel="noopener noreferrer" className="hp-btn hp-btn-primary">
              <i className="fa-brands fa-instagram me-2"></i> Follow Us
            </a>
          </div>
        </div>
      </section>

      {/* 10. CUSTOMER TESTIMONIALS */}
      <section className="hp-testimonials">
        <div className="container">
          <div className="hp-section-header" data-aos="fade-up">
            <h2 className="hp-section-title hp-heading">Words of Love</h2>
            <p className="hp-section-subtitle">Real experiences from our delighted customers</p>
          </div>
          <div id="testimonialCarousel" className="carousel slide pb-5" data-bs-ride="carousel" data-aos="fade-up" data-aos-delay="100">
            <div className="carousel-indicators hp-testi-indicators">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-bs-target="#testimonialCarousel"
                  data-bs-slide-to={idx}
                  className={idx === 0 ? "active" : ""}
                  aria-current={idx === 0 ? "true" : undefined}
                  aria-label={`Testimonial ${idx + 1}`}
                ></button>
              ))}
            </div>
            <div className="carousel-inner">
              {testimonials.map((t, idx) => (
                <div key={idx} className={`carousel-item ${idx === 0 ? "active" : ""}`}>
                  <div className="hp-premium-testi-card">
                    <i className="fa-solid fa-quote-left hp-premium-quote"></i>
                    <p className="hp-premium-testi-text">{t.text}</p>
                    <div className="hp-premium-testi-author">
                      <img src={t.image} alt={t.name} className="hp-premium-testi-img" loading="lazy" />
                      <div>
                        <div className="hp-premium-testi-name">{t.name}</div>
                        <div className="hp-premium-testi-rating">
                          {[...Array(t.rating)].map((_, i) => (
                            <i key={i} className="fa-solid fa-star"></i>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="carousel-control-prev hp-testi-control" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="prev">
              <span className="carousel-control-prev-icon" aria-hidden="true" style={{ filter: "invert(1) grayscale(100%) brightness(50%)" }}></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next hp-testi-control" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="next">
              <span className="carousel-control-next-icon" aria-hidden="true" style={{ filter: "invert(1) grayscale(100%) brightness(50%)" }}></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

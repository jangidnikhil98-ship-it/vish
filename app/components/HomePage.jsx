"use client";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero-banner">
        <div className="carousel">
          <div className="carousel-item active">
            <div className="carousel-caption">
              <span>Choose the Perfect Personalized Wooden Gifts</span>
              <h5>
                Create lasting memories with custom <br /> wooden engraved gifts
              </h5>
              <p>
                Shop beautifully handcrafted personalized wooden photo frames,
                plaques, and unique gifts.
              </p>
              <button onClick={() => window.location.href = "/product"}>
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SHIPPING */}
      <section className="shipping-categry">
        <div className="container">
          <div className="row">

            <div className="col-md-3">
              <div className="safe-payment">
                <h2>Free Delivery</h2>
                <p>Orders Over 299</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="safe-payment">
                <h2>Get Refund</h2>
                <p>Within 7 Days Returns</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="safe-payment">
                <h2>Safe Payment</h2>
                <p>100% Secure Payment</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="safe-payment">
                <h2>24/7 Support</h2>
                <p>Feel Free To Call Us</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CATEGORY */}
      <section className="category-section py-5">
        <div className="container">
          <h2>Our Category</h2>

          <div className="row text-center">

            <div className="col-md-3">
              <div className="category-item">
                <a href="/products/birthday">
                  <p>Birthday</p>
                </a>
              </div>
            </div>

            <div className="col-md-3">
              <div className="category-item">
                <a href="/products/bestseller">
                  <p>Miniature Frame</p>
                </a>
              </div>
            </div>

            <div className="col-md-3">
              <div className="category-item">
                <a href="/products/wedding">
                  <p>Wedding & Anniversary</p>
                </a>
              </div>
            </div>

            <div className="col-md-3">
              <div className="category-item">
                <a href="/products/mothers-day">
                  <p>Mother's Day</p>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="why-chooseus">
        <div className="container">
          <div className="row">

            <div className="col-md-6">
              <div className="proud-premium">
                <h6>About Vishwakarma Gifts</h6>
                <p>
                  Vishwakarma Gifts is a trusted online destination for
                  personalized wooden engraved gifts in India.
                  We specialize in custom wooden photo frames, engraved plaques,
                  and unique gifting solutions.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BESTSELLERS (STATIC DATA) */}
      <section className="category-section py-5">
        <div className="container">
          <h2>All Time Bestsellers</h2>

          <div className="row text-center">

            {/* STATIC PRODUCT 1 */}
            <div className="col-md-3">
              <div className="category-item-annivesary">
                <a href="/product/wooden-frame">
                  <p>Wooden Photo Frame</p>
                  <h2>₹499</h2>
                </a>
              </div>
            </div>

            {/* STATIC PRODUCT 2 */}
            <div className="col-md-3">
              <div className="category-item-annivesary">
                <a href="/product/keychain">
                  <p>Custom Keychain</p>
                  <h2>₹199</h2>
                </a>
              </div>
            </div>

            {/* STATIC PRODUCT 3 */}
            <div className="col-md-3">
              <div className="category-item-annivesary">
                <a href="/product/name-plate">
                  <p>Name Plate</p>
                  <h2>₹799</h2>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonails">
        <div className="container">

          <h2>People’s Say About Our Gifts</h2>

          <div className="row">

            <div className="col-md-4">
              <p>
                “Amazing quality and fast delivery. Highly recommended!”
              </p>
              <h6>Bhanu</h6>
            </div>

            <div className="col-md-4">
              <p>
                “Beautiful customization and premium finishing.”
              </p>
              <h6>Krishan</h6>
            </div>

            <div className="col-md-4">
              <p>
                “Best personalized gifts store I have used.”
              </p>
              <h6>Abhishek</h6>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
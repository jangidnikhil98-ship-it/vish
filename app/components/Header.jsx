"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useCart, formatINR } from "./CartProvider";
import { products as staticCatalog } from "@/lib/products";
import "./header.css";

// Categories used in the Shop dropdown (matches Laravel `route('frontend.page.products', ['type' => ...])` URLs).
const SHOP_LINKS = [
  { label: "Bestseller", type: "bestseller" },
  { label: "Birthday", type: "birthday" },
  { label: "Wedding & Anniversary", type: "wedding-anniversary" },
  { label: "Mothers Day", type: "mothers-day" },
  { label: "Fathers Day", type: "fathers-day" },
  { label: "Teachers Day", type: "teachers-day" },
  { label: "Natural Wooden Slice", type: "natural-wooden-slice" },
  { label: "Rectangle Wooden Frame", type: "rectangle-wooden-frame" },
];

export default function Header() {
  const router = useRouter();
  const { items, count, total, updateQuantity, removeItem } = useCart();
  const { user, logout } = useAuth();

  // --- mobile menu ---
  const [navOpen, setNavOpen] = useState(false);

  // --- account dropdown ---
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef(null);
  useEffect(() => {
    if (!acctOpen) return;
    const onDoc = (e) => {
      if (acctRef.current && !acctRef.current.contains(e.target)) {
        setAcctOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [acctOpen]);

  // --- scroll shadow on header ---
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- search overlay ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const searchInputRef = useRef(null);

  // Focus the search input when the overlay opens
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setSelectedIdx(-1);
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // ESC closes overlay
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced live search — calls /api/products/search (DB-backed, cached).
  // Falls back to the static catalog if the API isn't reachable yet (no DB).
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSelectedIdx(-1);
      return;
    }

    const controller = new AbortController();
    const id = setTimeout(async () => {
      const q = query.trim();
      setSearching(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(q)}&limit=20`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const json = await res.json();
          const items = (json?.data ?? []).map((p) => ({
            url: `/products/${p.slug}`,
            title: p.name,
            image: p.image ? `/storage/${p.image}` : "/img/no-image.png",
            price: p.finalPrice,
            price_withoutdiscount: p.price !== p.finalPrice ? p.price : null,
          }));
          setResults(items);
        } else {
          throw new Error(`Search failed: ${res.status}`);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        // Fallback: search the local static catalog so the overlay still works
        const ql = q.toLowerCase();
        setResults(
          staticCatalog
            .filter(
              (p) =>
                p.name.toLowerCase().includes(ql) ||
                p.category.toLowerCase().includes(ql),
            )
            .map((p) => ({
              url: `/products/${p.id}`,
              title: p.name,
              image: p.image,
              price: p.price,
              price_withoutdiscount: null,
            })),
        );
      } finally {
        setSelectedIdx(-1);
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  // Arrow / Enter navigation in results
  const onInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target =
        selectedIdx >= 0 ? results[selectedIdx] : results[0] ?? null;
      if (target) {
        setSearchOpen(false);
        router.push(target.url);
      }
    }
  };

  const highlight = (text) => {
    const q = query.trim();
    if (!q) return text;
    const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <span key={i} className="highlight">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  // Memoised total of items currently in cart (formatted)
  const totalFormatted = useMemo(() => formatINR(total), [total]);

  // --- Basket offcanvas (Bootstrap) ---
  // We don't rely on data-bs-toggle anymore because Bootstrap's JS loads
  // *after* DOMContentLoaded (strategy="afterInteractive") and so its
  // delegated click handler isn't attached to the trigger element. We call
  // the Bootstrap API explicitly here.
  const toggleBasket = (e) => {
    if (e) e.preventDefault();
    if (typeof window === "undefined") return;
    const el = document.getElementById("offcanvasExample");
    if (!el) return;

    const bs = window.bootstrap;
    if (bs?.Offcanvas) {
      bs.Offcanvas.getOrCreateInstance(el).toggle();
      return;
    }

    // Bootstrap hasn't finished loading yet — fallback that mimics what BS does.
    const isOpen = el.classList.contains("show");
    if (isOpen) {
      el.classList.remove("show");
      el.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      const backdrop = document.getElementById("__cart-backdrop");
      backdrop?.remove();
    } else {
      el.classList.add("show");
      el.removeAttribute("aria-hidden");
      el.style.visibility = "visible";
      document.body.style.overflow = "hidden";
      if (!document.getElementById("__cart-backdrop")) {
        const backdrop = document.createElement("div");
        backdrop.id = "__cart-backdrop";
        backdrop.className = "offcanvas-backdrop fade show";
        backdrop.addEventListener("click", () => toggleBasket());
        document.body.appendChild(backdrop);
      }
    }
  };

  const closeBasket = () => {
    if (typeof window === "undefined") return;
    const el = document.getElementById("offcanvasExample");
    if (!el) return;
    const bs = window.bootstrap;
    if (bs?.Offcanvas) {
      bs.Offcanvas.getOrCreateInstance(el).hide();
    } else if (el.classList.contains("show")) {
      toggleBasket();
    }
  };

  return (
    <>
      {/* TOP BAR */}
      <section className="main-header-new">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              <div className="social-media">
                <a href="#" aria-label="Facebook">
                  <i className="fa-brands fa-facebook"></i>
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="#" aria-label="YouTube">
                  <i className="fa-brands fa-youtube"></i>
                </a>
              </div>
            </div>

            <div className="col-md-4">
              <div className="save-usecode">
                <p>Save upto 5% : Orders Above Rs. 500! : Use Code: VISHWA05</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="call-data">
                <a href="tel:+918824942813">
                  <i className="fa-solid fa-phone"></i> +91 8824942813
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN HEADER */}
      <header className={`main-header${scrolled ? " scrolled" : ""}`}>
        <div className="logo">
          <Link href="/">
            <img
              src="/img/logo.svg"
              className="logo-img me-2"
              alt="Vishwakarma Gifts"
            />
          </Link>
        </div>

        <div
          className="menu-toggle"
          id="menu-toggle"
          onClick={() => setNavOpen((v) => !v)}
          role="button"
          aria-label="Toggle navigation"
        >
          &#9776;
        </div>

        <nav
          className={`main-nav${navOpen ? " show" : ""}`}
          id="nav"
        >
          <ul className="nav-list">
            <li className="nav-item">
              <Link href="/" onClick={() => setNavOpen(false)}>
                Home
              </Link>
            </li>

            <li className="nav-item dropdown">
              <span>
                Shop<span className="arrow">&#9662;</span>
              </span>
              <ul className="dropdown-menu">
                {SHOP_LINKS.map((s) => (
                  <li key={s.type}>
                    <Link
                      href={`/products?type=${s.type}`}
                      onClick={() => setNavOpen(false)}
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li className="nav-item">
              <Link href="/blogs" onClick={() => setNavOpen(false)}>
                News &amp; Blogs
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/products?type=wedding-anniversary"
                onClick={() => setNavOpen(false)}
              >
                Wedding &amp; Anniversary
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/contact" onClick={() => setNavOpen(false)}>
                Contact us
              </Link>
            </li>
          </ul>
        </nav>

        <div className="search-user">
          <Link href="/" className="home_icon" aria-label="Home">
            <i
              className="fa-regular fa-house"
              style={{ fontFamily: "FontAwesome" }}
            ></i>
          </Link>

          <a
            href="#"
            className="search-toggle"
            aria-label="Search"
            onClick={(e) => {
              e.preventDefault();
              setSearchOpen(true);
            }}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </a>

          <Link
            href="/products?type=bestseller"
            className="plus_icon"
            aria-label="Browse bestsellers"
          >
            <i className="fa-solid fa-plus"></i>
          </Link>

          <div className="account-menu" ref={acctRef}>
            <a
              href="#"
              aria-label="Account"
              onClick={(e) => {
                e.preventDefault();
                setAcctOpen((v) => !v);
              }}
            >
              <i className="fa-regular fa-user"></i>
            </a>
            {acctOpen && (
              <div className="account-dropdown">
                {user ? (
                  <>
                    <div className="account-greeting">
                      Hi, <strong>{user.first_name}</strong>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setAcctOpen(false)}
                    >
                      My Account
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setAcctOpen(false);
                        await logout();
                        router.push("/");
                        router.refresh();
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setAcctOpen(false)}>
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setAcctOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <a
            className="shopping-bag nav-link position-relative"
            href="#offcanvasExample"
            aria-label={`Open cart, ${count} items`}
            onClick={toggleBasket}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            <span
              id="basket-count"
              className="badge rounded-pill bg-danger position-absolute"
            >
              {count}
            </span>
          </a>
        </div>
      </header>

      {/* BASKET OFFCANVAS (right-side slide-in cart) */}
      <section className="add-productbasket">
        <div
          className="offcanvas offcanvas-end"
          id="offcanvasExample"
          tabIndex={-1}
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Basket</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={closeBasket}
            ></button>
          </div>

          <div className="offcanvas-body">
            <div className="pd-list">
              {items.length === 0 ? (
                <p className="text-center">Your basket is empty</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="addproduct-list">
                    <div className="product-image-cart">
                      <img
                        src={item.image || "/img/no-image.png"}
                        className="img-fluid"
                        alt={item.name}
                      />
                    </div>

                    <div className="pr-price">
                      <h2>{item.name}</h2>

                      <p>
                        Size:{" "}
                        <strong>{item.size ?? "N/A"} inches</strong>
                      </p>

                      <h6>Rs. {formatINR(item.price)}</h6>

                      <div className="prty-count">
                        <div className="practice-plus-minus">
                          <button
                            className="minus"
                            data-id={item.id}
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            -
                          </button>

                          <input
                            type="number"
                            className="quantity-input"
                            data-id={item.id}
                            value={item.quantity}
                            min={1}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!Number.isNaN(v) && v >= 1) {
                                updateQuantity(item.id, v);
                              }
                            }}
                          />

                          <button
                            className="plus"
                            data-id={item.id}
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>

                        <div className="delete-product">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove from basket"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pr-price-yut">
                      <h2>Rs {formatINR(item.price * item.quantity)}</h2>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TOTAL */}
            <div className="basket-box">
              <div className="total-price d-flex justify-content-between">
                <h2>Estimated Total:</h2>
                <h2 id="basket-total">Rs {totalFormatted}</h2>
              </div>

              <div className="go-basket mt-3">
                <Link
                  href="/checkout"
                  className="btn btn-primary w-100"
                  onClick={closeBasket}
                >
                  Go to Basket
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULLSCREEN SEARCH OVERLAY */}
      <div
        id="search-container"
        className={`fullscreen-search${searchOpen ? " visible" : ""}`}
      >
        <div className="search-top">
          <input
            ref={searchInputRef}
            type="text"
            id="search-input"
            placeholder="Search products..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <button
            type="button"
            className="search-close"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            &times;
          </button>
        </div>

        {searching && (
          <div className="search-loading" style={{ display: "block" }}>
            <div className="loader"></div>
          </div>
        )}

        <div
          id="search-results"
          className="row text-center justify-content-center g-4"
        >
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div className="no-results">No products found</div>
          )}

          {results.map((item, i) => (
            <div
              key={item.url}
              className={`col-6 col-sm-4 col-md-3 col-lg-3${
                selectedIdx === i ? " selected" : ""
              }`}
              data-aos="fade-up"
              data-aos-duration="500"
            >
              <div className="category-item-annivesary">
                <Link
                  href={item.url}
                  onClick={() => setSearchOpen(false)}
                >
                  <div className="birthday-item">
                    <img src={item.image} alt={item.title} />
                  </div>
                </Link>
                <div className="artificial-engvraed">
                  <Link
                    href={item.url}
                    onClick={() => setSearchOpen(false)}
                  >
                    <p>{highlight(item.title)}</p>
                    <div className="product-price">
                      <h2>₹{item.price}</h2>
                      {item.price_withoutdiscount ? (
                        <h6>₹{item.price_withoutdiscount}</h6>
                      ) : null}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Header() {
  const [basketCount, setBasketCount] = useState(0);
  const [basket, setBasket] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // 🔹 Fetch basket (REPLACES PHP)
  useEffect(() => {
    fetchBasket();
  }, []);

  const fetchBasket = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/basket");
      setBasket(res.data.items);
      setBasketCount(res.data.count);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Search (REPLACES jQuery AJAX)
  useEffect(() => {
    if (search.length < 2) return;

    const delay = setTimeout(async () => {
      const res = await axios.post("http://localhost:8000/api/search", {
        search,
      });
      setResults(res.data.results);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <>

      <section className="main-header-new">
  <div className="container-fluid">
    <div className="row">
      <div className="col-md-4">
        <div className="social-media">
          <a href=""> <i className="fa-brands fa-facebook"></i> </a>
          <a href=""> <i className="fa-brands fa-instagram"></i> </a>
          <a href=""> <i className="fa-brands fa-youtube"></i> </a>
        </div>
      </div>

      <div className="col-md-4">
        <div className="save-usecode">
          <p>Save upto 5% : Orders Above Rs. 500! : Use Code: VISHWA05</p>
        </div>

      </div>
      <div className="col-md-4">
        <div className="call-data">
          <a href=""> <i className="fa-solid fa-phone"></i> +91 8824942813 </a>
        </div>
      </div>

    </div>

  </div>

</section>

      {/* HEADER */}
      <header className="main-header">
        <div className="logo">
            <a href="/">
            <img src="/img/logo.svg" className="logo-img me-2" alt="Logo" />
            </a>
        </div>
         <div className="menu-toggle" id="menu-toggle">&#9776;</div>

        <nav className="main-nav" id="nav">
            <ul className="nav-list">
      <li className="nav-item"><a href="/">Home</a></li>
      <li className="nav-item dropdown">
        <span>Shop<span className="arrow">&#9662;</span></span>
        <ul className="dropdown-menu">
          <li><a href="/about">Bestseller</a></li>
          <li><a href="/about">Birthday</a></li>
          <li><a href="/about">Wedding & Anniversary</a></li>
          <li><a href="/about">Mothers Day</a></li>
          <li><a href="/about">Fathers Day</a></li>
          <li><a href="/about">Teachers Day</a></li>
          <li><a href="/about">Natural Wooden Slice</a></li>
          <li><a href="/about">Rectangle Wooden Frame</a></li>
        </ul>
      </li>
      <li className="nav-item"><a href="/about">News & Blogs</a></li>
      <li className="nav-item"><a href="/about">Wedding & Anniversary</a></li>
      <li className="nav-item"><a href="/about">Contact us</a></li>
            </ul>
        </nav>




    <div className="search-user">
        <a href="/" className="home_icon"><i className="fa-regular fa-house" style={{ fontFamily: "FontAwesome" }}></i></a>
        <a href="javascript:void(0)" className="search-toggle"> <i className="fa-solid fa-magnifying-glass"></i> </a>
        <a href="/about" className="plus_icon"> <i className="fa-solid fa-plus"></i> </a>
        <a href="/login"> <i className="fa-regular fa-user"></i> </a>
        <a className="shopping-bag nav-link position-relative"
      data-bs-toggle="offcanvas"
      href="#offcanvasExample">
      <i className="fa-solid fa-cart-shopping"></i>
      <span className="badge rounded-pill bg-danger position-absolute">
        {basketCount}
      </span>
    </a>
  </div>

      </header>

      {/* SEARCH RESULTS */}
      {results.length > 0 && (
        <div className="search-results">
          {results.map((item) => (
            <a key={item.id} href={item.url}>
              <img src={item.image} width={60} />
              <p>{item.title}</p>
              <p>₹{item.price}</p>
            </a>
          ))}
        </div>
      )}

      {/* BASKET */}
      <div className="basket">
        <h2>Basket</h2>

        {basket.length === 0 && <p>Empty</p>}

        {basket.map((item) => (
          <div key={item.id} className="basket-item">
            <img src={item.image} width={80} />
            <div>
              <h4>{item.name}</h4>
              <p>₹{item.price}</p>
            </div>
          </div>
        ))}

        <h3>Total: ₹{total}</h3>
      </div>
    </>
  );
}

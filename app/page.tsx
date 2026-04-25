import Link from "next/link";
import { products } from "@/lib/products";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./components/HomePage";

export default function Home() {
  return (
    <main>
      <Header />
      <HomePage />
      <Footer />
    </main>
  );
}

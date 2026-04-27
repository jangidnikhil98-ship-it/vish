import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/app/components/AuthProvider";
import { CartProvider } from "@/app/components/CartProvider";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import JsonLd from "@/app/components/JsonLd";
import "@/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const SITE_DESCRIPTION =
  "Personalized wooden engraved gifts in India — custom photo frames, plaques, name boards, keychains, and unique gifts for every occasion.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Vishwakarma Gifts — Personalized Wooden Engraved Gifts in India",
    template: "%s | Vishwakarma Gifts",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Vishwakarma Gifts",
  keywords: [
    "personalized wooden gifts",
    "engraved photo frames",
    "wooden gifts India",
    "custom wooden gifts",
    "engraved wooden plaque",
    "wedding gifts",
    "anniversary gifts",
    "birthday gifts",
  ],
  authors: [{ name: "Vishwakarma Gifts" }],
  creator: "Vishwakarma Gifts",
  publisher: "Vishwakarma Gifts",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Vishwakarma Gifts",
    title: "Vishwakarma Gifts — Personalized Wooden Engraved Gifts in India",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/img/banner.webp",
        width: 1200,
        height: 630,
        alt: "Vishwakarma Gifts — Personalized wooden engraved gifts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vishwakarma Gifts — Personalized Wooden Engraved Gifts in India",
    description: SITE_DESCRIPTION,
    images: ["/img/banner.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/img/favicon.png", type: "image/png", sizes: "any" },
    ],
    shortcut: "/img/favicon.png",
    apple: [{ url: "/img/favicon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export default function SiteRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vishwakarma Gifts",
    url: SITE_URL,
    logo: `${SITE_URL}/img/logo.svg`,
    description: SITE_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-8824942813",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
    sameAs: [
      "https://www.facebook.com/",
      "https://www.instagram.com/",
      "https://www.youtube.com/",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vishwakarma Gifts",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/products?type={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={poppins.variable}>
      <head>
        {/* Preconnect to third-party origins so the browser can start TLS
            handshakes in parallel with HTML parsing. Big perceived-perf win. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="" />
        <link rel="preconnect" href="https://ajax.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

        {/* Critical (render-blocking) CSS — Bootstrap layout + FontAwesome
            icons need to be ready before first paint or the header layout
            shifts and icons flash blank. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />

        {/* Non-critical CSS — Owl Carousel & AOS animations are below the
            fold. We load them with media="print" so the browser fetches
            them but does NOT block first paint, then a tiny inline script
            promotes them to media="all". Falls back gracefully if JS is off
            via <noscript>. */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css"
          media="print"
          data-async-css=""
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.theme.default.min.css"
          media="print"
          data-async-css=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/aos@2.3.1/dist/aos.css"
          media="print"
          data-async-css=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.querySelectorAll('link[data-async-css]').forEach(function(l){l.media='all'});",
          }}
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css"
          />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.theme.default.min.css"
          />
          <link
            rel="stylesheet"
            href="https://unpkg.com/aos@2.3.1/dist/aos.css"
          />
        </noscript>

        {/* Mobile browser theme color — applies to address bar */}
        <meta name="theme-color" content="#6b4423" />

        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
      </head>
      <body className={poppins.className}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>

        {/* Vendor JS — jQuery + Bootstrap stay afterInteractive because the
            cart offcanvas needs Bootstrap to be ready quickly. Owl + AOS are
            below-the-fold animations so we lazy-load them. */}
        <Script
          src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js"
          strategy="lazyOnload"
        />
        <Script
          src="https://unpkg.com/aos@2.3.1/dist/aos.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import "./admin.css";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Vishwakarma Gifts Admin",
  },
  description: "Vishwakarma Gifts admin panel",
  icons: { icon: "/img/favicon.png" },
  robots: { index: false, follow: false },
};

/**
 * Root layout for the admin section.
 *
 * This is a SEPARATE root layout from `(site)/layout.tsx` — it owns its
 * own `<html>`/`<body>` so the admin theme's jQuery / Bootstrap / Font
 * Awesome don't double-load with the storefront's CDN versions.
 *
 * The Pixelstrap "Zono" theme assets live in `public/backend/` and are
 * referenced exactly the way the original Laravel Blade did, e.g.
 *   /backend/css/style.css   (matches `asset('backend/css/style.css')`)
 */
export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="description"
          content="Vishwakarma Gifts admin panel"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@200;300;400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Roboto:300,300i,400,400i,500,500i,700,700i,900&display=swap"
          rel="stylesheet"
        />

        {/* Pixelstrap Zono — Font Awesome */}
        <link rel="stylesheet" href="/backend/css/font-awesome.css" />

        {/* Pixelstrap Zono — Plugins */}
        <link rel="stylesheet" href="/backend/css/vendors/slick.css" />
        <link rel="stylesheet" href="/backend/css/vendors/slick-theme.css" />
        <link rel="stylesheet" href="/backend/css/vendors/scrollbar.css" />
        <link rel="stylesheet" href="/backend/css/vendors/select2.css" />
        <link rel="stylesheet" href="/backend/css/vendors/animate.css" />
        <link rel="stylesheet" href="/backend/css/vendors/datatables.css" />
        <link rel="stylesheet" href="/backend/css/vendors/owlcarousel.css" />
        <link rel="stylesheet" href="/backend/css/vendors/jsgrid.css" />

        {/* Pixelstrap Zono — Bootstrap (theme-tuned) */}
        <link rel="stylesheet" href="/backend/css/vendors/bootstrap.css" />

        {/* Pixelstrap Zono — App + theme color */}
        <link rel="stylesheet" href="/backend/css/style.css" />
        <link
          id="color"
          rel="stylesheet"
          href="/backend/css/color-1.css"
          media="screen"
        />
        <link rel="stylesheet" href="/backend/css/responsive.css" />
        <link rel="stylesheet" href="/backend/css/developer.css" />
      </head>
      <body>
        {children}

        {/* Theme JS — order matches the original Blade layout exactly. */}
        <Script
          src="/backend/js/jquery.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/backend/js/bootstrap/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/icons/feather-icon/feather.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/icons/feather-icon/feather-icon.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/scrollbar/simplebar.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/scrollbar/custom.js"
          strategy="afterInteractive"
        />
        <Script src="/backend/js/config.js" strategy="afterInteractive" />
        <Script src="/backend/js/script.js" strategy="afterInteractive" />
        <Script
          src="/backend/js/sidebar-menu.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/sidebar-pin.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/select2/select2.full.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/select2/select2-custom.js"
          strategy="afterInteractive"
        />
        <Script
          src="/backend/js/tooltip-init.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

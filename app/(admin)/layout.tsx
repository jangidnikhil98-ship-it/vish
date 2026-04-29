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

        {/* jQuery first — beforeInteractive so it's available to ANY inline
            handler the rest of the theme drops onto the page. */}
        <Script
          src="/backend/js/jquery.min.js"
          strategy="beforeInteractive"
        />

        {/* Pixelstrap "Zono" was written for classic, ordered <script>
            tags. Next.js's <Script strategy="afterInteractive"> loads
            scripts in PARALLEL, so feather-icon.js was beating feather.min.js
            to execution → "feather is not defined" / "SimpleBar is not
            defined" / null `pinTitle` / undefined offset(). The fix below
            is a tiny serial loader: each script only starts loading after
            the previous one has finished executing. */}
        <Script
          id="vish-admin-theme-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var sources = [
    "/backend/js/bootstrap/bootstrap.bundle.min.js",
    "/backend/js/icons/feather-icon/feather.min.js",
    "/backend/js/icons/feather-icon/feather-icon.js",
    "/backend/js/scrollbar/simplebar.js",
    "/backend/js/scrollbar/custom.js",
    "/backend/js/config.js",
    "/backend/js/script.js",
    "/backend/js/sidebar-menu.js",
    // sidebar-pin.js intentionally skipped — it requires a .pin-title
    // element + .fa-thumb-tack icons in the sidebar (a "pin menu items"
    // feature from the original Laravel template). Our React port has
    // neither, so the script crashes on togglePinnedName() with a null
    // dereference and provides no other functionality.
    "/backend/js/select2/select2.full.min.js",
    "/backend/js/select2/select2-custom.js",
    "/backend/js/tooltip-init.js"
  ];
  function loadNext(i){
    if(i>=sources.length) return;
    var s=document.createElement("script");
    s.src=sources[i];
    s.async=false;
    s.onload=function(){loadNext(i+1);};
    s.onerror=function(){console.error("[admin-theme] failed to load",sources[i]);loadNext(i+1);};
    document.body.appendChild(s);
  }
  loadNext(0);
})();`,
          }}
        />
      </body>
    </html>
  );
}

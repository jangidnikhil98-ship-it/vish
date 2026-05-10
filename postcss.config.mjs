const config = {
  // Keep PostCSS minimal on low-resource shared hosting.
  // Tailwind v4's PostCSS plugin may spawn workers and hit EAGAIN limits.
  plugins: {},
};

export default config;

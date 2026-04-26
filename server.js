/**
 * Custom Node.js server entry point used by cPanel / Phusion Passenger.
 *
 * cPanel "Setup Node.js App" requires a single startup file. This file boots
 * the Next.js production server programmatically so it can run behind
 * Passenger on shared hosting.
 *
 * IMPORTANT: Run `npm install` and `npm run build` BEFORE starting the app.
 * The .next/ build output must exist at runtime.
 */

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error("Request handler error:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      });
    }).listen(port, () => {
      console.log(
        `> Next.js ready on http://${hostname}:${port} (NODE_ENV=${
          process.env.NODE_ENV || "development"
        })`,
      );
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });

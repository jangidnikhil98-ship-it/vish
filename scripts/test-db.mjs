// Quick DB connection sanity check.
//   Usage:  node scripts/test-db.mjs
//
// Reads `.env` / `.env.local` (Next.js convention), connects to MySQL,
// and prints whether a few key tables are present and how many rows they
// have. Exits non-zero on failure so it's CI-friendly.

import "dotenv/config";
import mysql from "mysql2/promise";

const env = (...names) => {
  for (const n of names) {
    const v = process.env[n];
    if (v != null && v !== "") return v;
  }
  return undefined;
};

const required = (...names) => {
  const v = env(...names);
  if (!v) {
    console.error(
      `[test-db] Missing required env var. Set one of: ${names.join(", ")}`,
    );
    process.exit(1);
  }
  return v;
};

const cfg = {
  host: env("DB_HOST") ?? "localhost",
  port: Number(env("DB_PORT") ?? 3306),
  user: required("DB_USER", "DB_USERNAME"),
  password: env("DB_PASSWORD") ?? "",
  database: required("DB_NAME", "DB_DATABASE"),
};

console.log(
  `[test-db] connecting to mysql://${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database} …`,
);

let conn;
try {
  conn = await mysql.createConnection(cfg);
  console.log("[test-db] ✓ connected");
} catch (err) {
  console.error("[test-db] ✗ connection failed:", err.message);
  process.exit(2);
}

const TABLES = [
  "products",
  "product_images",
  "product_sizes",
  "ratting",
  "blogs",
  "enquiries",
  "orders",
  "order_items",
  "shipping_details",
  "payment_details",
  "basket",
  "users",
];

let allOk = true;
for (const t of TABLES) {
  try {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM \`${t}\``,
    );
    console.log(`  • ${t.padEnd(20)} ${rows[0].c} rows`);
  } catch (err) {
    allOk = false;
    console.log(`  • ${t.padEnd(20)} ✗ ${err.code ?? err.message}`);
  }
}

await conn.end();

if (!allOk) {
  console.warn(
    "\n[test-db] Some tables are missing. If you haven't run migrations yet, run them in your Laravel project (`php artisan migrate`) — Drizzle will use the same database.",
  );
  process.exit(3);
}

console.log("\n[test-db] ✓ all expected tables present");

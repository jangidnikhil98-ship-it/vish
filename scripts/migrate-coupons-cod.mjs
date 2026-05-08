#!/usr/bin/env node
/**
 * One-shot migration: adds everything required for the new
 *   1) Coupon-code discount system
 *   2) Cash-on-Delivery (COD) checkout flow
 *   3) Shiprocket shipping integration
 *
 * Specifically, this script:
 *   • creates the `coupons`, `coupon_redemptions`, and `site_settings` tables
 *   • adds the new financial columns to `orders`
 *     (subtotal, discount_amount, shipping_fee, cod_fee, payment_method,
 *      coupon_id, coupon_code) plus their indexes
 *   • adds the Shiprocket tracking columns to `shipping_details`
 *   • seeds default site settings (cod_enabled, cod_fee, cod_min_order_amount,
 *     shiprocket_pickup_location, shiprocket_default_weight_kg)
 *
 * Idempotent — safe to run as many times as you like. Each step checks
 * whether the column / index / row already exists.
 *
 *   npm run db:migrate-coupons-cod
 */

import { config } from "dotenv";
import mysql from "mysql2/promise";

config({ path: ".env" });
config({ path: ".env.local", override: true });

function envOr(...names) {
  for (const name of names) {
    const v = process.env[name];
    if (v && v.length > 0) return v;
  }
  return undefined;
}

const host = envOr("DB_HOST") ?? "127.0.0.1";
const port = Number(envOr("DB_PORT") ?? 3306);
const user = envOr("DB_USER", "DB_USERNAME") ?? "root";
const password = envOr("DB_PASSWORD", "DB_PASS") ?? "";
const database = envOr("DB_NAME", "DB_DATABASE");

if (!database) {
  console.error(
    "ERROR: DB_NAME (or DB_DATABASE) must be set in .env so I know which database to migrate.",
  );
  process.exit(1);
}

console.log(`Connecting to MySQL ${user}@${host}:${port}/${database} ...`);

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
  multipleStatements: false,
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function tableExists(table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?`,
    [table],
  );
  return rows[0].c > 0;
}

async function columnExists(table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows[0].c > 0;
}

async function indexExists(table, indexName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?`,
    [table, indexName],
  );
  return rows[0].c > 0;
}

async function ensureColumn(table, column, addSql) {
  if (await columnExists(table, column)) {
    console.log(`✔ ${table}.${column} already exists.`);
  } else {
    console.log(`→ Adding ${table}.${column} ...`);
    await conn.query(addSql);
    console.log(`✔ ${table}.${column} added.`);
  }
}

async function ensureIndex(table, indexName, createSql) {
  if (await indexExists(table, indexName)) {
    console.log(`✔ index ${table}.${indexName} already exists.`);
  } else {
    console.log(`→ Adding index ${table}.${indexName} ...`);
    await conn.query(createSql);
    console.log(`✔ index ${table}.${indexName} added.`);
  }
}

async function ensureSetting(key, value, description) {
  const [rows] = await conn.query(
    `SELECT id FROM site_settings WHERE key_name = ? LIMIT 1`,
    [key],
  );
  if (rows.length > 0) {
    console.log(`✔ site_settings[${key}] already set.`);
    return;
  }
  console.log(`→ Seeding site_settings[${key}] = "${value}"`);
  await conn.query(
    `INSERT INTO site_settings (key_name, value, description, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [key, value, description],
  );
}

/* ------------------------------------------------------------------ */
/*  1) Create new tables                                               */
/* ------------------------------------------------------------------ */

try {
  if (!(await tableExists("coupons"))) {
    console.log("→ Creating table coupons ...");
    await conn.query(`
      CREATE TABLE coupons (
        id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        code            VARCHAR(64)     NOT NULL,
        type            ENUM('percent','free_shipping') NOT NULL DEFAULT 'percent',
        value           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
        min_order_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        max_discount_amount DECIMAL(10,2) NULL,
        usage_limit     INT UNSIGNED    NULL,
        used_count      INT UNSIGNED    NOT NULL DEFAULT 0,
        description     VARCHAR(255)    NULL,
        valid_from      TIMESTAMP       NULL,
        valid_until     TIMESTAMP       NULL,
        is_active       TINYINT UNSIGNED NOT NULL DEFAULT 1,
        created_at      TIMESTAMP       NULL,
        updated_at      TIMESTAMP       NULL,
        PRIMARY KEY (id),
        UNIQUE KEY coupons_code_unique (code),
        KEY idx_coupons_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✔ coupons table created.");
  } else {
    console.log("✔ coupons table already exists.");
  }

  if (!(await tableExists("coupon_redemptions"))) {
    console.log("→ Creating table coupon_redemptions ...");
    await conn.query(`
      CREATE TABLE coupon_redemptions (
        id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        coupon_id       BIGINT UNSIGNED NOT NULL,
        order_id        BIGINT UNSIGNED NOT NULL,
        user_id         BIGINT UNSIGNED NULL,
        guest_id        VARCHAR(255)    NULL,
        discount_amount DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
        created_at      TIMESTAMP       NULL,
        PRIMARY KEY (id),
        KEY idx_redemptions_coupon (coupon_id),
        KEY idx_redemptions_order (order_id),
        KEY idx_redemptions_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✔ coupon_redemptions table created.");
  } else {
    console.log("✔ coupon_redemptions table already exists.");
  }

  if (!(await tableExists("site_settings"))) {
    console.log("→ Creating table site_settings ...");
    await conn.query(`
      CREATE TABLE site_settings (
        id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        key_name    VARCHAR(100)    NOT NULL,
        value       TEXT            NULL,
        description VARCHAR(255)    NULL,
        created_at  TIMESTAMP       NULL,
        updated_at  TIMESTAMP       NULL,
        PRIMARY KEY (id),
        UNIQUE KEY site_settings_key_unique (key_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✔ site_settings table created.");
  } else {
    console.log("✔ site_settings table already exists.");
  }

  /* ------------------------------------------------------------------ */
  /*  2) New columns on orders                                           */
  /* ------------------------------------------------------------------ */

  await ensureColumn(
    "orders",
    "subtotal",
    `ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER grand_total`,
  );
  await ensureColumn(
    "orders",
    "discount_amount",
    `ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER subtotal`,
  );
  await ensureColumn(
    "orders",
    "shipping_fee",
    `ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_amount`,
  );
  await ensureColumn(
    "orders",
    "cod_fee",
    `ALTER TABLE orders ADD COLUMN cod_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER shipping_fee`,
  );
  await ensureColumn(
    "orders",
    "payment_method",
    `ALTER TABLE orders ADD COLUMN payment_method VARCHAR(32) NOT NULL DEFAULT 'razorpay' AFTER cod_fee`,
  );
  await ensureColumn(
    "orders",
    "coupon_id",
    `ALTER TABLE orders ADD COLUMN coupon_id BIGINT UNSIGNED NULL AFTER payment_method`,
  );
  await ensureColumn(
    "orders",
    "coupon_code",
    `ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(64) NULL AFTER coupon_id`,
  );

  await ensureIndex(
    "orders",
    "idx_orders_payment_method",
    `ALTER TABLE orders ADD INDEX idx_orders_payment_method (payment_method)`,
  );
  await ensureIndex(
    "orders",
    "idx_orders_coupon",
    `ALTER TABLE orders ADD INDEX idx_orders_coupon (coupon_id)`,
  );

  // Backfill subtotal for any existing rows from grand_total (since pre-
  // migration we had no separate subtotal column).
  console.log(
    "→ Backfilling orders.subtotal = grand_total for rows with subtotal=0 ...",
  );
  const [backfillResult] = await conn.query(
    `UPDATE orders
        SET subtotal = grand_total
      WHERE subtotal = 0.00 AND grand_total IS NOT NULL`,
  );
  console.log(
    `✔ Backfilled subtotal for ${backfillResult.affectedRows} order(s).`,
  );

  /* ------------------------------------------------------------------ */
  /*  3) Shiprocket columns on shipping_details                          */
  /* ------------------------------------------------------------------ */

  await ensureColumn(
    "shipping_details",
    "shiprocket_order_id",
    `ALTER TABLE shipping_details ADD COLUMN shiprocket_order_id VARCHAR(64) NULL AFTER is_save`,
  );
  await ensureColumn(
    "shipping_details",
    "shiprocket_shipment_id",
    `ALTER TABLE shipping_details ADD COLUMN shiprocket_shipment_id VARCHAR(64) NULL AFTER shiprocket_order_id`,
  );
  await ensureColumn(
    "shipping_details",
    "awb_code",
    `ALTER TABLE shipping_details ADD COLUMN awb_code VARCHAR(64) NULL AFTER shiprocket_shipment_id`,
  );
  await ensureColumn(
    "shipping_details",
    "courier_company_id",
    `ALTER TABLE shipping_details ADD COLUMN courier_company_id VARCHAR(32) NULL AFTER awb_code`,
  );
  await ensureColumn(
    "shipping_details",
    "tracking_url",
    `ALTER TABLE shipping_details ADD COLUMN tracking_url VARCHAR(500) NULL AFTER courier_company_id`,
  );
  await ensureColumn(
    "shipping_details",
    "tracking_status",
    `ALTER TABLE shipping_details ADD COLUMN tracking_status VARCHAR(64) NULL AFTER tracking_url`,
  );
  await ensureColumn(
    "shipping_details",
    "tracking_updated_at",
    `ALTER TABLE shipping_details ADD COLUMN tracking_updated_at TIMESTAMP NULL AFTER tracking_status`,
  );
  await ensureIndex(
    "shipping_details",
    "idx_shipping_awb",
    `ALTER TABLE shipping_details ADD INDEX idx_shipping_awb (awb_code)`,
  );

  /* ------------------------------------------------------------------ */
  /*  4) Seed default site_settings                                       */
  /* ------------------------------------------------------------------ */

  await ensureSetting(
    "cod_enabled",
    "1",
    "1 = Cash on Delivery available, 0 = disabled.",
  );
  await ensureSetting(
    "cod_fee",
    "50",
    "Flat handling charge (INR) added to COD orders.",
  );
  await ensureSetting(
    "cod_min_order_amount",
    "0",
    "Minimum order subtotal (INR) required for COD; 0 = no minimum.",
  );
  await ensureSetting(
    "cod_max_order_amount",
    "20000",
    "Maximum order subtotal (INR) allowed for COD; 0 = no maximum.",
  );
  await ensureSetting(
    "shiprocket_pickup_location",
    "Primary",
    "Pickup location nickname configured in your Shiprocket dashboard (Settings → Pickup Addresses).",
  );
  await ensureSetting(
    "shiprocket_default_weight_kg",
    "0.5",
    "Fallback shipment weight (kg) when product weight is missing.",
  );
  await ensureSetting(
    "shiprocket_default_length_cm",
    "15",
    "Fallback shipment length (cm).",
  );
  await ensureSetting(
    "shiprocket_default_breadth_cm",
    "15",
    "Fallback shipment breadth (cm).",
  );
  await ensureSetting(
    "shiprocket_default_height_cm",
    "5",
    "Fallback shipment height (cm).",
  );
  await ensureSetting(
    "shiprocket_auto_create_order",
    "1",
    "If 1, a Shiprocket order is created automatically when our order is placed.",
  );
  await ensureSetting(
    "default_shipping_fee",
    "0",
    "Flat shipping fee (INR) when no live Shiprocket rate is requested. 0 = free shipping.",
  );

  console.log("\n✅ All done. Summary:");
  console.log("   • Coupon tables ready");
  console.log("   • COD columns added to orders");
  console.log("   • Shiprocket columns added to shipping_details");
  console.log("   • Default site_settings seeded\n");
  console.log("Next steps:");
  console.log(
    "   1) Set SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD / SHIPROCKET_WEBHOOK_TOKEN in .env",
  );
  console.log(
    "   2) Configure your pickup location in Shiprocket dashboard, then update",
  );
  console.log(
    "      site_settings.shiprocket_pickup_location to match its nickname",
  );
  console.log(
    "   3) Restart the Next.js app so it picks up the new env vars.\n",
  );
} finally {
  await conn.end();
}

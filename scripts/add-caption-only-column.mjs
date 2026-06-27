#!/usr/bin/env node
/**
 * One-shot migration: add the `is_caption_only` column to the existing `products` table
 * if it is not already there. Idempotent — safe to run multiple times.
 *
 *   node scripts/add-caption-only-column.mjs
 */

import { config } from "dotenv";
import mysql from "mysql2/promise";

config({ path: "env" });
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
});

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

async function ensureColumn(table, column, addSql) {
  if (await columnExists(table, column)) {
    console.log(`✔ ${table}.${column} already exists.`);
  } else {
    console.log(`→ Adding ${table}.${column} ...`);
    await conn.query(addSql);
    console.log(`✔ ${table}.${column} added.`);
  }
}

try {
  await ensureColumn(
    "products",
    "is_caption_only",
    `ALTER TABLE products
       ADD COLUMN is_caption_only TINYINT(1) UNSIGNED NOT NULL DEFAULT 0
       AFTER status`,
  );

  console.log("\nMigration completed successfully.");
} finally {
  await conn.end();
}

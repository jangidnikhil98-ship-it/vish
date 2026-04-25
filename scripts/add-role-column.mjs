#!/usr/bin/env node
/**
 * One-shot migration: add the `role` column to the existing `users` table
 * if it is not already there. Idempotent — safe to run multiple times.
 *
 *   npm run db:add-role
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

try {
  await ensureColumn(
    "users",
    "role",
    `ALTER TABLE users
       ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user'
       AFTER is_email_verify`,
  );

  if (await indexExists("users", "idx_users_role")) {
    console.log("✔ idx_users_role index already exists.");
  } else {
    console.log("→ Adding idx_users_role index ...");
    await conn.query(`ALTER TABLE users ADD INDEX idx_users_role (role)`);
    console.log("✔ idx_users_role added.");
  }

  // The Laravel admin views referenced these columns (Edit User + Settings),
  // but the original migrations never declared them. Add them here so the
  // admin panel works end-to-end on a fresh install.
  await ensureColumn(
    "users",
    "city",
    `ALTER TABLE users ADD COLUMN city VARCHAR(255) NULL AFTER role`,
  );
  await ensureColumn(
    "users",
    "country_code",
    `ALTER TABLE users ADD COLUMN country_code VARCHAR(8) NULL AFTER city`,
  );
  await ensureColumn(
    "users",
    "company_name",
    `ALTER TABLE users ADD COLUMN company_name VARCHAR(255) NULL AFTER country_code`,
  );

  console.log("\nAll done. You can now run:");
  console.log(
    "  node scripts/admin-promote.mjs you@example.com   (promote a user to admin)",
  );
} finally {
  await conn.end();
}

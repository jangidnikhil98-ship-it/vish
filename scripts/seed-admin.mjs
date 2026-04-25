#!/usr/bin/env node
/**
 * Seed (or update) the default admin user.
 *
 *   npm run db:seed-admin
 *
 * Reads credentials from `.env`:
 *   ADMIN_SEED_EMAIL      (default: admin@vishwakarmagifts.com)
 *   ADMIN_SEED_PASSWORD   (default: Admin@12345)
 *   ADMIN_SEED_FIRST_NAME (default: Admin)
 *   ADMIN_SEED_LAST_NAME  (default: User)
 *
 * Behaviour:
 *  • If a user with that email already exists, it is promoted to role='admin',
 *    activated, and (only if --reset-password is passed) the password is reset.
 *  • Otherwise a new active admin user is inserted.
 */

import { config } from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const args = process.argv.slice(2);
const resetPassword = args.includes("--reset-password");

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
  console.error("ERROR: DB_NAME (or DB_DATABASE) must be set in .env");
  process.exit(1);
}

const seedEmail = (
  envOr("ADMIN_SEED_EMAIL") ?? "admin@vishwakarmagifts.com"
)
  .toLowerCase()
  .trim();
const seedPassword = envOr("ADMIN_SEED_PASSWORD") ?? "Admin@12345";
const seedFirstName = envOr("ADMIN_SEED_FIRST_NAME") ?? "Admin";
const seedLastName = envOr("ADMIN_SEED_LAST_NAME") ?? "User";

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
});

try {
  const [rows] = await conn.query(
    `SELECT id, first_name, last_name, email, role, is_active
       FROM users
      WHERE email = ?
      LIMIT 1`,
    [seedEmail],
  );

  if (rows.length > 0) {
    const u = rows[0];
    const updates = [];
    const params = [];

    if (u.role !== "admin") {
      updates.push("role = ?");
      params.push("admin");
    }
    if (Number(u.is_active) !== 1) {
      updates.push("is_active = 1");
    }
    if (u.deleted_at != null) {
      updates.push("deleted_at = NULL");
    }
    if (resetPassword) {
      const hash = await bcrypt.hash(seedPassword, 10);
      updates.push("password = ?");
      params.push(hash);
    }

    if (updates.length === 0) {
      console.log(
        `User #${u.id} <${u.email}> is already an active admin. Nothing to do.`,
      );
      console.log(
        `  (pass --reset-password if you want to reset the password to "${seedPassword}".)`,
      );
      process.exit(0);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(u.id);
    await conn.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    console.log(`Existing user #${u.id} <${u.email}> updated:`);
    console.log(`  role        → admin`);
    console.log(`  is_active   → 1`);
    if (resetPassword) {
      console.log(`  password    → "${seedPassword}"`);
    }
  } else {
    const hash = await bcrypt.hash(seedPassword, 10);
    const [result] = await conn.query(
      `INSERT INTO users
         (first_name, last_name, email, password, role, is_active,
          is_email_verify, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', 1, 1,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [seedFirstName, seedLastName, seedEmail, hash],
    );
    console.log(`Created admin user #${result.insertId}:`);
    console.log(`  email       ${seedEmail}`);
    console.log(`  password    ${seedPassword}`);
    console.log(`  name        ${seedFirstName} ${seedLastName}`);
  }

  console.log("");
  console.log("Sign in at: http://localhost:3000/admin/login");
} finally {
  await conn.end();
}

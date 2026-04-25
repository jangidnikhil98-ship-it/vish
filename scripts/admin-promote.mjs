#!/usr/bin/env node
/**
 * Promote (or demote) a user to admin by email address.
 *
 *   npm run admin:promote -- you@example.com           # → role='admin'
 *   npm run admin:promote -- you@example.com --revoke  # → role='user'
 *
 * Requires that `users.role` already exists. Run `npm run db:add-role`
 * first if it doesn't.
 */

import { config } from "dotenv";
import mysql from "mysql2/promise";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const revoke = args.includes("--revoke") || args.includes("--demote");

if (!email) {
  console.error("Usage: npm run admin:promote -- <email> [--revoke]");
  process.exit(1);
}

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

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
});

const newRole = revoke ? "user" : "admin";
const normalized = email.toLowerCase().trim();

try {
  const [rows] = await conn.query(
    `SELECT id, first_name, last_name, email, role, is_active
       FROM users
      WHERE email = ?
        AND deleted_at IS NULL
      LIMIT 1`,
    [normalized],
  );
  if (rows.length === 0) {
    console.error(`No active user found with email "${normalized}".`);
    process.exit(2);
  }

  const u = rows[0];
  if (u.role === newRole) {
    console.log(
      `User #${u.id} <${u.email}> is already role='${newRole}'. Nothing to change.`,
    );
    process.exit(0);
  }

  await conn.query(
    `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newRole, u.id],
  );

  console.log(
    `✔ #${u.id} ${u.first_name} ${u.last_name ?? ""} <${u.email}>  role: '${u.role}' → '${newRole}'`,
  );
  if (newRole === "admin") {
    console.log("  They can now log in at /admin/login");
  }
} finally {
  await conn.end();
}

import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * Read DB env vars supporting BOTH Node-style and Laravel-style names,
 * so an existing Laravel .env works without renaming anything.
 *   DB_USER  ←→ DB_USERNAME
 *   DB_NAME  ←→ DB_DATABASE
 */
const env = (...names: string[]): string | undefined => {
  for (const n of names) {
    const v = process.env[n];
    if (v != null && v !== "") return v;
  }
  return undefined;
};

const DB_HOST = env("DB_HOST") ?? "localhost";
const DB_PORT = env("DB_PORT") ?? "3306";
const DB_USER = env("DB_USER", "DB_USERNAME");
const DB_PASSWORD = env("DB_PASSWORD") ?? "";
const DB_NAME = env("DB_NAME", "DB_DATABASE");

if (!DB_USER || !DB_NAME) {
  throw new Error(
    "Drizzle config: set DB_USER (or DB_USERNAME) and DB_NAME (or DB_DATABASE) in .env.local",
  );
}

// Use a connection URL because drizzle-kit's object form rejects empty
// passwords (which is the WAMP/MAMP default for `root`).
const url = `mysql://${encodeURIComponent(DB_USER)}${
  DB_PASSWORD ? `:${encodeURIComponent(DB_PASSWORD)}` : ""
}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config;

import "server-only";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: MySql2Database<typeof schema> | undefined;
}

/**
 * Read an env var, supporting BOTH the Node-style names and the Laravel-style
 * names so an existing Laravel .env file works without changes.
 *   DB_USER     ← falls back to DB_USERNAME
 *   DB_NAME     ← falls back to DB_DATABASE
 *   DB_PASSWORD ← same in both
 */
function envOr(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v != null && v !== "") return v;
  }
  return undefined;
}

function requireEnv(...names: string[]): string {
  const v = envOr(...names);
  if (!v) {
    throw new Error(
      `Missing required env var. Set one of: ${names.join(", ")} in .env.local`,
    );
  }
  return v;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: envOr("DB_HOST") ?? "localhost",
    port: Number(envOr("DB_PORT") ?? 3306),
    user: requireEnv("DB_USER", "DB_USERNAME"),
    password: envOr("DB_PASSWORD") ?? "",
    database: requireEnv("DB_NAME", "DB_DATABASE"),
    connectionLimit: Number(envOr("DB_POOL_LIMIT") ?? 10),
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    timezone: "Z",
    dateStrings: false,
  });
}

/** Lazy DB getter — only creates the pool on first query call.
 *  Lets `next build` run without DB credentials. */
export function getDb(): MySql2Database<typeof schema> {
  if (global.__drizzleDb) return global.__drizzleDb;

  const pool = global.__mysqlPool ?? createPool();
  if (process.env.NODE_ENV !== "production") {
    global.__mysqlPool = pool;
  }

  const db = drizzle(pool, { schema, mode: "default" });
  if (process.env.NODE_ENV !== "production") {
    global.__drizzleDb = db;
  }
  return db;
}

/** Convenience proxy. Use `db.select()...` like normal Drizzle syntax. */
export const db: MySql2Database<typeof schema> = new Proxy(
  {} as MySql2Database<typeof schema>,
  {
    get(_target, prop: keyof MySql2Database<typeof schema>) {
      const real = getDb();
      const value = real[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
  },
);

export type Db = MySql2Database<typeof schema>;

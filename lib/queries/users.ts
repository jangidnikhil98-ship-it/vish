import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";

export interface PublicUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  profile_img: string | null;
  is_active: number;
  is_email_verify: number;
  role: string;
}

export interface UserWithPassword extends PublicUser {
  password: string | null;
}

/* -------------------------- Reads -------------------------------------- */

export async function getUserByEmail(
  email: string,
): Promise<UserWithPassword | null> {
  const rows = await db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      password: users.password,
      phone: users.phone,
      profile_img: users.profile_img,
      is_active: users.is_active,
      is_email_verify: users.is_email_verify,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.email, email.toLowerCase()), isNull(users.deleted_at)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const rows = await db
    .select({
      id: users.id,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
      phone: users.phone,
      profile_img: users.profile_img,
      is_active: users.is_active,
      is_email_verify: users.is_email_verify,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deleted_at)))
    .limit(1);

  return rows[0] ?? null;
}

/* -------------------------- Writes ------------------------------------- */

export async function createUser(input: {
  first_name: string;
  last_name: string;
  email: string;
  passwordHash: string;
}): Promise<number> {
  const result = await db.insert(users).values({
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email.toLowerCase(),
    password: input.passwordHash,
    is_active: 1,
    is_email_verify: 1,
    created_at: sql`CURRENT_TIMESTAMP`,
    updated_at: sql`CURRENT_TIMESTAMP`,
  });
  // mysql2 returns { insertId } on the first element of the array result
  // Drizzle wraps it differently between versions; this branch handles both.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return Number(insertId);
}

export async function updatePassword(params: {
  userId: number;
  passwordHash: string;
}): Promise<void> {
  await db
    .update(users)
    .set({
      password: params.passwordHash,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(users.id, params.userId));
}

export async function touchLastLogin(userId: number): Promise<void> {
  await db
    .update(users)
    .set({ last_login_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(users.id, userId));
}

/* -------------------------- Password reset tokens ---------------------- */
/*
 * Schema is the standard Laravel `password_reset_tokens` table:
 *   email (PK) | token | created_at
 *
 * We store ONLY the SHA-256 hash of the token, not the plaintext, so a
 * leaked DB cannot be used to mint password resets.
 */

export async function upsertPasswordResetToken(params: {
  email: string;
  tokenHash: string;
}): Promise<void> {
  const email = params.email.toLowerCase();

  // INSERT ... ON DUPLICATE KEY UPDATE — emulated cross-Drizzle-version safe.
  const existing = await db
    .select({ email: passwordResetTokens.email })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(passwordResetTokens)
      .set({
        token: params.tokenHash,
        created_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(passwordResetTokens.email, email));
  } else {
    await db.insert(passwordResetTokens).values({
      email,
      token: params.tokenHash,
      created_at: sql`CURRENT_TIMESTAMP`,
    });
  }
}

export interface PasswordResetTokenRow {
  email: string;
  token: string;
  created_at: Date | null;
}

export async function getPasswordResetByHash(
  tokenHash: string,
): Promise<PasswordResetTokenRow | null> {
  const rows = await db
    .select({
      email: passwordResetTokens.email,
      token: passwordResetTokens.token,
      created_at: passwordResetTokens.created_at,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, tokenHash))
    .limit(1);
  return rows[0] ?? null;
}

export async function deletePasswordResetByEmail(email: string): Promise<void> {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.email, email.toLowerCase()));
}

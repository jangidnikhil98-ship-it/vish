import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";

/**
 * Lazy Razorpay client.
 *
 * We avoid instantiating the client at module load so that `next build`
 * doesn't fail when env vars are absent. The first call to `razorpay()`
 * inside an API route validates env vars and creates the client.
 */
let _client: Razorpay | null = null;

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export function razorpay(): Razorpay {
  if (_client) return _client;
  _client = new Razorpay({
    key_id: readEnv("RAZORPAY_KEY"),
    key_secret: readEnv("RAZORPAY_SECRET"),
  });
  return _client;
}

export function razorpayKeyId(): string {
  return readEnv("RAZORPAY_KEY");
}

/**
 * Verifies a signed Razorpay client-side payment payload.
 *
 * Razorpay docs:
 *   generated_signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
 *   if generated_signature == razorpay_signature → payment authentic
 */
export function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const secret = readEnv("RAZORPAY_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.razorpay_order_id}|${params.razorpay_payment_id}`)
    .digest("hex");

  // Constant-time compare
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(params.razorpay_signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies the payload of a Razorpay webhook against the configured webhook
 * secret. The body MUST be the raw request body (string), not a parsed object.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const secret = readEnv("RAZORPAY_WEBHOOK_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

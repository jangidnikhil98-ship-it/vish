import "server-only";

/**
 * WhatsApp notification helper.
 *
 * Supports two cheap, popular gateways used widely in India. Pick whichever
 * you prefer in `WHATSAPP_PROVIDER`:
 *
 *   - "ultramsg"  → https://ultramsg.com   (free trial, ~₹500/mo prod)
 *   - "greenapi"  → https://green-api.com  (free tier available)
 *   - "none"      → disabled (default — logs to console only)
 *
 * Required env vars when enabled:
 *   WHATSAPP_PROVIDER=ultramsg|greenapi
 *   WHATSAPP_INSTANCE_ID=<from provider dashboard>
 *   WHATSAPP_TOKEN=<from provider dashboard>
 *   WHATSAPP_ADMIN_NUMBER=+91XXXXXXXXXX   (where to send admin alerts)
 *
 * Designed to **never throw**: callers (checkout, webhook) ignore failures
 * so a flaky WhatsApp gateway can't break the order flow.
 */

const PROVIDER = (process.env.WHATSAPP_PROVIDER ?? "none").toLowerCase();
const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID ?? "";
const TOKEN = process.env.WHATSAPP_TOKEN ?? "";
const ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER ?? "";

/** Strip everything except digits and ensure a 91 country code prefix. */
function normalizeNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function ultramsgSend(to: string, message: string): Promise<void> {
  const url = `https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`;
  const body = new URLSearchParams({
    token: TOKEN,
    to,
    body: message,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`UltraMSG ${res.status}: ${text}`);
  }
}

async function greenapiSend(to: string, message: string): Promise<void> {
  const url = `https://api.green-api.com/waInstance${INSTANCE_ID}/sendMessage/${TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: `${to}@c.us`,
      message,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GreenAPI ${res.status}: ${text}`);
  }
}

/**
 * Send a WhatsApp text message to a single number.
 * Phone may be in any format (with or without +91 / spaces / dashes).
 */
export async function sendWhatsAppMessage(params: {
  to: string;
  message: string;
}): Promise<void> {
  if (PROVIDER === "none" || !INSTANCE_ID || !TOKEN) {
    console.info(
      "[whatsapp] not configured — would have sent",
      JSON.stringify({ to: params.to, message: params.message.slice(0, 80) }),
    );
    return;
  }

  const to = normalizeNumber(params.to);
  if (!to) {
    console.warn("[whatsapp] empty/invalid number, skipping");
    return;
  }

  try {
    if (PROVIDER === "ultramsg") {
      await ultramsgSend(to, params.message);
    } else if (PROVIDER === "greenapi") {
      await greenapiSend(to, params.message);
    } else {
      console.warn(`[whatsapp] unknown provider: ${PROVIDER}`);
      return;
    }
    console.info("[whatsapp] sent to", to);
  } catch (err) {
    console.error("[whatsapp] send failed:", err);
  }
}

/* ============================================================
   Pre-built notification templates
   ============================================================ */

const formatINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

export type WhatsAppOrderItem = {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
};

export type AdminWhatsAppOrderPayload = {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail: string;
  totalAmount: number;
  items: WhatsAppOrderItem[];
  shippingPincode?: string | null;
  shippingCity?: string | null;
};

/**
 * Notify the shop owner over WhatsApp that a new paid order arrived.
 * Uses ADMIN_NUMBER from env. Returns silently if not configured.
 */
export async function sendAdminOrderWhatsApp(
  payload: AdminWhatsAppOrderPayload,
): Promise<void> {
  if (!ADMIN_NUMBER) {
    console.info(
      "[whatsapp] WHATSAPP_ADMIN_NUMBER not set — skipping admin alert",
    );
    return;
  }

  const lines: string[] = [];
  lines.push(`🎉 *New order received!*`);
  lines.push("");
  lines.push(`*Order:* ${payload.orderNumber}`);
  lines.push(`*Total:* ₹${formatINR(payload.totalAmount)}`);
  lines.push(`*Customer:* ${payload.customerName}`);
  if (payload.customerPhone) lines.push(`*Phone:* ${payload.customerPhone}`);
  lines.push(`*Email:* ${payload.customerEmail}`);
  if (payload.shippingCity || payload.shippingPincode) {
    lines.push(
      `*Ship to:* ${[payload.shippingCity, payload.shippingPincode]
        .filter(Boolean)
        .join(" - ")}`,
    );
  }
  lines.push("");
  lines.push(`*Items:*`);
  for (const it of payload.items) {
    lines.push(
      `• ${it.name}${it.size ? ` (${it.size})` : ""} × ${it.quantity} — ₹${formatINR(it.price * it.quantity)}`,
    );
  }
  lines.push("");
  lines.push(`Open: ${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/admin/orders`);

  await sendWhatsAppMessage({
    to: ADMIN_NUMBER,
    message: lines.join("\n"),
  });
}

/**
 * (Optional) Send a WhatsApp confirmation to the customer too.
 * Only fires when the customer provided a 10-digit Indian phone number.
 */
export async function sendCustomerOrderWhatsApp(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
}): Promise<void> {
  if (!params.to) return;
  const message =
    `Hi ${params.customerName}! 🎁\n\n` +
    `Your order *${params.orderNumber}* has been received successfully.\n` +
    `Total paid: *₹${formatINR(params.totalAmount)}*\n\n` +
    `We're crafting your gift with love and will keep you posted.\n` +
    `Thank you for choosing Vishwakarma Gifts!`;

  await sendWhatsAppMessage({ to: params.to, message });
}

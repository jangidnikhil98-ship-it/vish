import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/* ============================================================
   Brand / config
   ============================================================ */

const BRAND_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Vishwakarma Gifts";
const BRAND_PRIMARY = "#603813";
const BRAND_SOFT_BG = "#fdf7ef";
const BRAND_BORDER = "rgba(96, 56, 19, 0.12)";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? "+91 8824942813";

/* ============================================================
   Transport (lazy + cached)
   ============================================================ */

let cachedTransporter: Transporter | null = null;

function buildTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      // 465 = implicit TLS, anything else = STARTTLS upgrade.
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

function fromAddress(): string {
  return (
    process.env.SMTP_FROM ??
    `"${BRAND_NAME}" <${process.env.SMTP_USER ?? "noreply@example.com"}>`
  );
}

/**
 * Send an email through the configured SMTP transport.
 *
 * Designed to be **non-blocking from the caller's perspective**: if SMTP
 * isn't configured we just log and return, so callers (checkout, register,
 * password reset) never crash because of email problems.
 */
async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<void> {
  const transporter = buildTransport();
  if (!transporter) {
    console.info(
      "[email] SMTP not configured — skipping email",
      JSON.stringify({ to: opts.to, subject: opts.subject }),
    );
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? stripHtml(opts.html),
      replyTo: opts.replyTo,
    });
    console.info(
      "[email] sent",
      JSON.stringify({
        to: opts.to,
        subject: opts.subject,
        messageId: info.messageId,
      }),
    );
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

const stripHtml = (s: string): string =>
  s
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (s: string | null | undefined): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

/* ============================================================
   Layout
   ============================================================ */

function layout(opts: {
  preheader: string;
  title: string;
  body: string;
  cta?: { label: string; url: string };
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f1e7;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#2c1c0a;">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:0;mso-hide:all;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND_PRIMARY};padding:22px 28px;color:#fff;font-family:'Libre Bodoni',Georgia,serif;font-size:22px;font-weight:600;">
              ${escapeHtml(BRAND_NAME)}
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 14px;font-family:'Libre Bodoni',Georgia,serif;font-size:24px;color:${BRAND_PRIMARY};font-weight:600;">
                ${escapeHtml(opts.title)}
              </h1>
              ${opts.body}
              ${
                opts.cta
                  ? `<p style="margin:24px 0 0;text-align:center;">
                      <a href="${escapeHtml(opts.cta.url)}"
                        style="display:inline-block;background:${BRAND_PRIMARY};color:#fff;text-decoration:none;font-weight:500;
                        padding:12px 24px;border-radius:8px;font-size:15px;">
                        ${escapeHtml(opts.cta.label)}
                      </a>
                    </p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND_SOFT_BG};padding:18px 28px;font-size:12px;color:#6b5a45;text-align:center;border-top:1px solid ${BRAND_BORDER};">
              You're receiving this email because you placed an order or signed up at
              <a href="${SITE_URL}" style="color:${BRAND_PRIMARY};text-decoration:none;">${escapeHtml(BRAND_NAME)}</a>.
              <br />Need help? Reply to this email or WhatsApp us at <strong>${escapeHtml(ADMIN_PHONE)}</strong>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ============================================================
   1) Welcome email (after registration)
   ============================================================ */

export type WelcomePayload = {
  to: string;
  firstName: string;
};

export async function sendWelcomeEmail(payload: WelcomePayload): Promise<void> {
  const html = layout({
    preheader: `Welcome to ${BRAND_NAME} — happy to have you!`,
    title: `Welcome to ${BRAND_NAME}!`,
    body: `
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Hi ${escapeHtml(payload.firstName)},
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Thank you for creating your account. We craft personalised wooden gifts
        with love — engraved photo frames, plaques, name boards, keychains and
        more — perfect for every special occasion.
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Browse our latest collection and let us help you create memories that last.
      </p>
    `,
    cta: { label: "Start shopping", url: `${SITE_URL}/products` },
  });

  await sendMail({
    to: payload.to,
    subject: `Welcome to ${BRAND_NAME}!`,
    html,
  });
}

/* ============================================================
   2) Order confirmation (to customer)
   ============================================================ */

export type OrderEmailItem = {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
  variation?: string | null;
  giftWrap?: string;
};

export type OrderConfirmationPayload = {
  to: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  items: OrderEmailItem[];
  shipping?: {
    address?: string | null;
    apartment?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
  } | null;
  paymentId?: string | null;
};

export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload,
): Promise<void> {
  const itemsHtml = payload.items
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid ${BRAND_BORDER};font-size:14px;">
            <strong>${escapeHtml(it.name)}</strong>
            ${it.size ? `<div style="color:#6b5a45;font-size:12px;">Size: ${escapeHtml(it.size)}</div>` : ""}
            ${it.giftWrap === "yes" ? `<div style="color:${BRAND_PRIMARY};font-size:12px;">🎁 Gift wrapped</div>` : ""}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid ${BRAND_BORDER};font-size:14px;text-align:center;">
            ${it.quantity}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid ${BRAND_BORDER};font-size:14px;text-align:right;">
            ₹${formatINR(it.price * it.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const shippingHtml = payload.shipping
    ? `
      <h3 style="margin:24px 0 8px;font-size:15px;color:${BRAND_PRIMARY};">Shipping to</h3>
      <div style="background:${BRAND_SOFT_BG};border:1px solid ${BRAND_BORDER};border-radius:10px;padding:14px;font-size:14px;line-height:1.6;">
        <strong>${escapeHtml(payload.customerName)}</strong><br />
        ${[
          payload.shipping.apartment,
          payload.shipping.address,
          payload.shipping.city,
          payload.shipping.state,
          payload.shipping.pincode,
        ]
          .filter(Boolean)
          .map(escapeHtml)
          .join(", ")}
        ${payload.shipping.phone ? `<br />📞 ${escapeHtml(payload.shipping.phone)}` : ""}
      </div>`
    : "";

  const html = layout({
    preheader: `Order ${payload.orderNumber} confirmed — total ₹${formatINR(payload.totalAmount)}`,
    title: "Thank you — your order is confirmed!",
    body: `
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Hi ${escapeHtml(payload.customerName)},
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        We've received your order and will start crafting it with love.
        Here are the details:
      </p>

      <div style="background:${BRAND_SOFT_BG};border:1px solid ${BRAND_BORDER};border-radius:10px;padding:14px 16px;font-size:14px;margin-bottom:16px;">
        <div><strong>Order number:</strong> ${escapeHtml(payload.orderNumber)}</div>
        ${payload.paymentId ? `<div><strong>Payment ID:</strong> ${escapeHtml(payload.paymentId)}</div>` : ""}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:collapse;border:1px solid ${BRAND_BORDER};border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:${BRAND_SOFT_BG};color:${BRAND_PRIMARY};">
            <th align="left" style="padding:10px 12px;font-size:12px;text-transform:uppercase;">Item</th>
            <th align="center" style="padding:10px 12px;font-size:12px;text-transform:uppercase;">Qty</th>
            <th align="right" style="padding:10px 12px;font-size:12px;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" align="right" style="padding:14px 12px;font-size:15px;border-top:2px solid ${BRAND_BORDER};">
              <strong>Grand total</strong>
            </td>
            <td align="right" style="padding:14px 12px;font-size:15px;border-top:2px solid ${BRAND_BORDER};">
              <strong>₹${formatINR(payload.totalAmount)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      ${shippingHtml}

      <p style="font-size:14px;line-height:1.6;color:#6b5a45;margin:18px 0 0;">
        We'll notify you again once your order ships. If anything looks off,
        just reply to this email and we'll sort it out.
      </p>
    `,
    cta: { label: "Track my order", url: `${SITE_URL}/dashboard/orders` },
  });

  await sendMail({
    to: payload.to,
    subject: `Order Confirmed — ${payload.orderNumber}`,
    html,
  });
}

/* ============================================================
   3) Admin "new order received" email
   ============================================================ */

export type AdminOrderNotificationPayload = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  totalAmount: number;
  items: OrderEmailItem[];
  shipping?: OrderConfirmationPayload["shipping"];
  paymentId?: string | null;
  adminUrl?: string | null;
};

export async function sendAdminOrderNotification(
  payload: AdminOrderNotificationPayload,
): Promise<void> {
  if (!ADMIN_EMAIL) {
    console.info("[email] ADMIN_EMAIL not set — skipping admin notification");
    return;
  }

  const itemsHtml = payload.items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid ${BRAND_BORDER};font-size:13px;">
            ${escapeHtml(it.name)}${it.size ? ` (${escapeHtml(it.size)})` : ""}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid ${BRAND_BORDER};font-size:13px;text-align:center;">
            ${it.quantity}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid ${BRAND_BORDER};font-size:13px;text-align:right;">
            ₹${formatINR(it.price * it.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const shippingHtml = payload.shipping
    ? `
      <p style="margin:16px 0 4px;font-size:13px;color:${BRAND_PRIMARY};font-weight:600;">Ship to:</p>
      <div style="background:${BRAND_SOFT_BG};border:1px solid ${BRAND_BORDER};border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.55;">
        ${escapeHtml(payload.customerName)}<br />
        ${[
          payload.shipping.apartment,
          payload.shipping.address,
          payload.shipping.city,
          payload.shipping.state,
          payload.shipping.pincode,
        ]
          .filter(Boolean)
          .map(escapeHtml)
          .join(", ")}
        ${payload.shipping.phone ? `<br />📞 ${escapeHtml(payload.shipping.phone)}` : ""}
      </div>`
    : "";

  const html = layout({
    preheader: `🎉 New order ${payload.orderNumber} — ₹${formatINR(payload.totalAmount)} from ${payload.customerName}`,
    title: `🎉 New order received!`,
    body: `
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        A new paid order just landed. Quick summary:
      </p>

      <div style="background:${BRAND_SOFT_BG};border:1px solid ${BRAND_BORDER};border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.7;margin-bottom:14px;">
        <div><strong>Order:</strong> ${escapeHtml(payload.orderNumber)}</div>
        <div><strong>Total:</strong> ₹${formatINR(payload.totalAmount)}</div>
        <div><strong>Customer:</strong> ${escapeHtml(payload.customerName)}</div>
        <div><strong>Email:</strong> ${escapeHtml(payload.customerEmail)}</div>
        ${payload.customerPhone ? `<div><strong>Phone:</strong> ${escapeHtml(payload.customerPhone)}</div>` : ""}
        ${payload.paymentId ? `<div><strong>Payment ID:</strong> ${escapeHtml(payload.paymentId)}</div>` : ""}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:collapse;border:1px solid ${BRAND_BORDER};border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:${BRAND_SOFT_BG};color:${BRAND_PRIMARY};">
            <th align="left" style="padding:8px 12px;font-size:11px;text-transform:uppercase;">Item</th>
            <th align="center" style="padding:8px 12px;font-size:11px;text-transform:uppercase;">Qty</th>
            <th align="right" style="padding:8px 12px;font-size:11px;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      ${shippingHtml}
    `,
    cta: payload.adminUrl
      ? { label: "Open in admin", url: payload.adminUrl }
      : undefined,
  });

  await sendMail({
    to: ADMIN_EMAIL,
    subject: `🎉 New order ${payload.orderNumber} — ₹${formatINR(payload.totalAmount)}`,
    html,
    replyTo: payload.customerEmail,
  });
}

/* ============================================================
   4) Password reset
   ============================================================ */

export type PasswordResetPayload = {
  to: string;
  firstName: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(
  payload: PasswordResetPayload,
): Promise<void> {
  const html = layout({
    preheader: "Reset your password",
    title: "Reset your password",
    body: `
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Hi ${escapeHtml(payload.firstName)},
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        We received a request to reset your password. Click the button below
        to set a new one — this link will expire in 60 minutes.
      </p>
      <p style="font-size:13px;line-height:1.55;color:#6b5a45;margin:0 0 12px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `,
    cta: { label: "Reset password", url: payload.resetUrl },
  });

  await sendMail({
    to: payload.to,
    subject: `Reset your ${BRAND_NAME} password`,
    html,
  });
}

import "server-only";

/**
 * Order-confirmation email helper.
 *
 * Designed to be **optional**: if SMTP env vars are not configured we
 * silently log instead of throwing — so the checkout flow never fails
 * just because mail isn't wired up yet. Plug in `nodemailer` later by
 * replacing the body of `sendOrderConfirmation`.
 *
 * Required env vars (when ready):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export type OrderConfirmationPayload = {
  to: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
};

export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload,
): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(
      "[email] SMTP not configured — skipping order-confirmation email",
      {
        to: payload.to,
        orderNumber: payload.orderNumber,
        totalAmount: payload.totalAmount,
      },
    );
    return;
  }

  // TODO: integrate nodemailer once SMTP creds are available.
  // import nodemailer from "nodemailer";
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from, to: payload.to, subject, html });

  console.info(
    "[email] (stub) would send order confirmation",
    payload.orderNumber,
    "to",
    payload.to,
  );
}

/**
 * Password-reset email. Same graceful-degradation policy: if SMTP isn't
 * configured we log the reset URL to the console so a developer can still
 * test the flow locally.
 */
export type PasswordResetPayload = {
  to: string;
  firstName: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(
  payload: PasswordResetPayload,
): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(
      "[email] SMTP not configured — printing password reset link instead",
    );
    console.info(`[email] Reset link for ${payload.to}: ${payload.resetUrl}`);
    return;
  }

  // TODO: nodemailer integration when SMTP creds land.
  console.info(
    "[email] (stub) would send password reset to",
    payload.to,
    "→",
    payload.resetUrl,
  );
}

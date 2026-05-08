import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  shippingDetails,
} from "@/lib/db/schema";
import {
  assignAwb,
  cancelShiprocketOrder,
  createShiprocketOrder,
  type CreateOrderResult,
} from "@/lib/shiprocket";
import { setShiprocketDetails } from "@/lib/queries/orders";
import { getShiprocketSettings } from "@/lib/queries/admin/settings";

/**
 * Whether the current settings (and env vars) allow us to auto-push orders
 * to Shiprocket. Cheap to call — used as the gate before fire-and-forget
 * `createShiprocketOrderForOrder()` calls.
 */
export async function shouldAutoCreateShiprocket(): Promise<boolean> {
  const sr = await getShiprocketSettings();
  if (!sr.autoCreateOrder) return false;
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    return false;
  }
  return true;
}

/**
 * Push an existing local order into Shiprocket and persist the resulting
 * IDs / AWB on `shipping_details`. Used by:
 *   - /api/checkout/create-order (COD branch, immediately after create)
 *   - /api/checkout/verify-payment + /api/payment/webhook (prepaid, on
 *     first transition to "paid")
 *   - admin "Push to Shiprocket" retry button (future)
 *
 * Idempotent: if the row already has a `shiprocket_order_id` we do nothing.
 *
 * Throws on Shiprocket failure — callers usually want to swallow this with
 * `.catch(...)` and let an admin retry later.
 */
export async function createShiprocketOrderForOrder(
  orderId: number,
  opts: { paymentMethod: "Prepaid" | "COD" },
): Promise<CreateOrderResult | null> {
  const sr = await getShiprocketSettings();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) {
    throw new Error(`order ${orderId} not found`);
  }

  const [shipping] = await db
    .select()
    .from(shippingDetails)
    .where(eq(shippingDetails.order_id, orderId))
    .limit(1);
  if (!shipping) {
    throw new Error(`shipping_details missing for order ${orderId}`);
  }

  // Idempotent: already pushed.
  if (shipping.shiprocket_order_id) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.order_id, orderId));

  const subtotal = Number(order.subtotal ?? order.grand_total ?? 0);

  const res = await createShiprocketOrder({
    orderId: order.order_number,
    orderDate: new Date().toISOString().slice(0, 19).replace("T", " "),
    pickupLocation: sr.pickupLocation,
    paymentMethod: opts.paymentMethod,
    billing: {
      customerName: shipping.first_name ?? "Customer",
      lastName: shipping.last_name ?? "",
      address: (shipping.address ?? "").trim() || (shipping.apartment ?? "").trim() || "—",
      address2: shipping.apartment ?? "",
      city: (shipping.city ?? "").trim() || (shipping.state ?? "").trim() || "—",
      state: shipping.state ?? "",
      pincode: shipping.pincode ?? "",
      email: shipping.email ?? "",
      phone: shipping.phone ?? "",
    },
    orderItems: items.map((it) => ({
      name: it.product_name ?? "Product",
      sku: `P-${it.product_id ?? 0}`,
      units: Number(it.quantity ?? 1),
      sellingPrice: Number(it.price ?? 0),
    })),
    // Goods value, NOT grand total. Shiprocket will add COD charges + courier
    // rate itself based on the payment_method we send.
    subTotal: Math.max(0, subtotal),
    weightKg: sr.defaultWeightKg,
    lengthCm: sr.defaultLengthCm,
    breadthCm: sr.defaultBreadthCm,
    heightCm: sr.defaultHeightCm,
  });

  await setShiprocketDetails({
    orderId,
    shiprocketOrderId: res.shiprocketOrderId,
    shiprocketShipmentId: res.shipmentId,
    awbCode: res.awbCode,
  });

  // Best-effort: assign an AWB. Shiprocket's /orders/create/adhoc only
  // returns an AWB if you've set "auto-AWB" in the dashboard, so we always
  // try here. Failure is non-fatal — the order is still queued in SR and
  // an admin can pick a courier manually.
  if (!res.awbCode && res.shipmentId) {
    try {
      const awb = await assignAwb(res.shipmentId);
      await setShiprocketDetails({
        orderId,
        shiprocketOrderId: res.shiprocketOrderId,
        shiprocketShipmentId: res.shipmentId,
        awbCode: awb.awbCode,
        courierCompanyId: awb.courierCompanyId,
      });
      res.awbCode = awb.awbCode;
    } catch (err) {
      console.warn(
        "[shiprocket] AWB auto-assignment failed for order",
        order.order_number,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return res;
}

/**
 * Cancel an order's Shiprocket booking, if any. No-op when the order has
 * no Shiprocket id. Used by the admin Cancel-order flow and by the
 * abandoned-pending-order janitor.
 */
export async function cancelShiprocketOrderForOrder(
  orderId: number,
): Promise<void> {
  const [shipping] = await db
    .select({ shiprocketOrderId: shippingDetails.shiprocket_order_id })
    .from(shippingDetails)
    .where(eq(shippingDetails.order_id, orderId))
    .limit(1);
  if (!shipping?.shiprocketOrderId) return;
  try {
    await cancelShiprocketOrder(shipping.shiprocketOrderId);
  } catch (err) {
    // Already-cancelled / not-found → ignore. Anything else gets logged
    // but doesn't propagate (admin already saw the success message).
    console.warn(
      "[shiprocket] cancel failed for order",
      orderId,
      err instanceof Error ? err.message : err,
    );
  }
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminCouponById } from "@/lib/queries/admin/coupons";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { FlashMessage } from "../../../_components/FlashMessage";
import { CouponForm } from "../../_components/CouponForm";
import { toDateTimeLocal } from "../../_components/datetime";

export const metadata: Metadata = { title: "Edit Coupon | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminCouponEditPage({
  params,
  searchParams,
}: Props) {
  const [{ id: idStr }, sp] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const coupon = await getAdminCouponById(id);
  if (!coupon) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit Coupon"
        crumbs={[
          { label: "Coupons", href: "/admin/coupons" },
          { label: coupon.code },
        ]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <div className="container-fluid">
        <CouponForm
          mode="edit"
          couponId={coupon.id}
          initial={{
            code: coupon.code,
            type: coupon.type,
            value: Number(coupon.value),
            min_order_amount: Number(coupon.min_order_amount),
            max_discount_amount:
              coupon.max_discount_amount === null
                ? null
                : Number(coupon.max_discount_amount),
            usage_limit: coupon.usage_limit,
            description: coupon.description ?? "",
            valid_from: toDateTimeLocal(coupon.valid_from),
            valid_until: toDateTimeLocal(coupon.valid_until),
            is_active: coupon.is_active === 1 ? 1 : 0,
          }}
        />
      </div>
    </>
  );
}

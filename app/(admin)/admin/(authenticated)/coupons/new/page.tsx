import type { Metadata } from "next";

import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { FlashMessage } from "../../_components/FlashMessage";
import { CouponForm } from "../_components/CouponForm";

export const metadata: Metadata = { title: "Create Coupon | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminCouponNewPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <>
      <AdminPageHeader
        title="Create Coupon"
        crumbs={[
          { label: "Coupons", href: "/admin/coupons" },
          { label: "Create" },
        ]}
      />
      <FlashMessage success={sp.success} error={sp.error} />

      <div className="container-fluid">
        <CouponForm
          mode="create"
          initial={{
            code: "",
            type: "percent",
            value: 10,
            min_order_amount: 0,
            max_discount_amount: null,
            usage_limit: null,
            description: "",
            valid_from: "",
            valid_until: "",
            is_active: 1,
          }}
        />
      </div>
    </>
  );
}

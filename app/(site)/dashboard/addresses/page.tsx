import Link from "next/link";
import { readSession } from "@/lib/auth";
import { listUserSavedAddresses } from "@/lib/queries/orders";

export const dynamic = "force-dynamic";

const formatDate = (d: Date | null): string => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
};

export default async function DashboardAddressesPage() {
  const session = await readSession();
  if (!session) return null;

  const addresses = await listUserSavedAddresses(session.sub);

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2>Saved addresses</h2>
        <span className="text-muted small">
          {addresses.length === 0
            ? "No addresses yet"
            : `${addresses.length} address${addresses.length === 1 ? "" : "es"}`}
        </span>
      </div>

      {addresses.length === 0 ? (
        <div className="dashboard-empty">
          <i className="fa-solid fa-location-dot" aria-hidden="true" />
          <p>
            No saved addresses yet. Place an order with the &quot;Save this
            information for next time&quot; option ticked and it will appear
            here.
          </p>
          <Link href="/products" className="btn-primary-themed">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="dashboard-address-grid">
          {addresses.map((a, i) => (
            <div key={i} className="dashboard-address-card">
              <strong>
                {a.firstName ?? ""} {a.lastName ?? ""}
              </strong>
              <div>
                {[a.apartment, a.address, a.city, a.state, a.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {a.phone && (
                <div className="text-muted small">
                  <i className="fa-solid fa-phone fa-xs" /> {a.phone}
                </div>
              )}
              {a.lastUsedAt && (
                <div className="text-muted small mt-2">
                  Last used: {formatDate(a.lastUsedAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DeliveryContactsPanel from "@/components/admin/DeliveryContactsPanel";

/** Standalone entry point for the delivery-team roster — previously only reachable via the "Delivery Team" button inside the Packing page, which meant a role with MANAGE_DELIVERY_AGENTS but not VIEW_TREATMENT had no way to reach it at all. */
export default function AdminDeliveryPage() {
  const router = useRouter();

  return (
    <AdminShell>
      <DeliveryContactsPanel onClose={() => router.push("/admin")} />
    </AdminShell>
  );
}

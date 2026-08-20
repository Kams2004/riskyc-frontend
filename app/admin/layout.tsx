import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin – Riskyc Fashion",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No Navbar/Footer/ChatBlob in admin
  return <>{children}</>;
}

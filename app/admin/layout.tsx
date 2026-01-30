import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Dakshamani Naturo Food",
  description: "Admin panel for managing products, offers, and coupons",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


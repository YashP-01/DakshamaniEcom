import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products - Dakshamani Naturo Food",
  description: "Browse our premium collection of natural products",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


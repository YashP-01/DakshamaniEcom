import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import TestModeBanner from "@/components/test-mode-banner";
import { TransitionProvider } from "@/lib/context/transition-context";
import SmoothScrollProvider from "@/components/smooth-scroll-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dakshamani Naturo Food - Premium Dry Fruits & Natural Products",
  description: "Shop premium dry fruits, masalas, sweets, ghee, moringa powder and more natural products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SmoothScrollProvider>
          <TransitionProvider>
            {children}
            <Toaster />
            <TestModeBanner />
          </TransitionProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}


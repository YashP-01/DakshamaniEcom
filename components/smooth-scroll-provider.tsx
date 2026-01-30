"use client";

import { useEffect } from "react";
import { initSmoothScroll } from "@/lib/utils/smooth-scroll";

/**
 * Provider component that initializes smooth scrolling across the entire website
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize smooth scroll behavior
    initSmoothScroll();

    // Enhanced scroll performance
    if (typeof window !== "undefined") {
      // Use passive event listeners for better performance
      let ticking = false;

      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            // Any scroll-based logic can go here
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });

      // Optimize scroll performance
      document.documentElement.style.scrollBehavior = "smooth";

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return <>{children}</>;
}











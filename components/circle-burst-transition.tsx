"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTransition } from "@/lib/context/transition-context";

interface CircleBurstTransitionProps {
  isLoading?: boolean;
  onAnimationComplete?: () => void;
}

export default function CircleBurstTransition({ 
  isLoading = false,
  onAnimationComplete 
}: CircleBurstTransitionProps) {
  const { transitionState, endTransition } = useTransition();
  const [phase, setPhase] = useState<"burst" | "reveal" | "complete">("burst");
  const [maxRadius, setMaxRadius] = useState(2000);
  const { isTransitioning, clickPosition } = transitionState;

  // Calculate the maximum radius needed to cover the entire viewport
  useEffect(() => {
    if (typeof window !== "undefined" && clickPosition) {
      const radius = Math.max(
        Math.sqrt(
          Math.pow(Math.max(clickPosition.x, window.innerWidth - clickPosition.x), 2) +
          Math.pow(Math.max(clickPosition.y, window.innerHeight - clickPosition.y), 2)
        ) * 1.2, // Add 20% buffer
        2000 // Minimum radius
      );
      setMaxRadius(radius);
    }
  }, [clickPosition]);

  // Update CSS variable for circle radius to control page content visibility
  useEffect(() => {
    if (typeof document !== "undefined" && isTransitioning && clickPosition) {
      const circleRadius = phase === "burst" ? 0 : phase === "reveal" ? maxRadius : maxRadius;
      document.documentElement.style.setProperty("--circle-radius", `${circleRadius}px`);
      document.documentElement.style.setProperty("--circle-x", `${clickPosition.x}px`);
      document.documentElement.style.setProperty("--circle-y", `${clickPosition.y}px`);
    } else {
      document.documentElement.style.setProperty("--circle-radius", "2000px");
    }
  }, [phase, maxRadius, isTransitioning, clickPosition]);

  useEffect(() => {
    if (!isTransitioning) {
      setPhase("burst");
      return;
    }

    // Phase 1: Start with small circle at click point, wait for content if needed
    setPhase("burst");
    
    // If content is already loaded, start expanding immediately
    if (!isLoading) {
      const revealTimer = setTimeout(() => {
        setPhase("reveal");
      }, 100);
      return () => clearTimeout(revealTimer);
    }
  }, [isTransitioning, isLoading]);

  // Separate effect to handle transition when loading completes
  useEffect(() => {
    if (phase === "burst" && !isLoading && isTransitioning) {
      // Content has loaded, start the circle out (expand) animation
      const revealTimer = setTimeout(() => {
        setPhase("reveal");
      }, 50);
      return () => clearTimeout(revealTimer);
    }
  }, [phase, isLoading, isTransitioning]);

  // Handle reveal phase completion (circle fully expanded)
  useEffect(() => {
    if (phase === "reveal") {
      const completeTimer = setTimeout(() => {
        setPhase("complete");
        endTransition();
        onAnimationComplete?.();
      }, 800); // Time for circle to expand completely
      return () => clearTimeout(completeTimer);
    }
  }, [phase, endTransition, onAnimationComplete]);

  if (!isTransitioning || !clickPosition) return null;

  return (
    <AnimatePresence>
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Loading Indicator (shown during burst phase when content is loading) */}
          {phase === "burst" && isLoading && (
            <motion.div
              className="absolute"
              style={{
                left: clickPosition.x,
                top: clickPosition.y,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-2xl"
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full bg-white"
                  animate={{
                    scale: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}


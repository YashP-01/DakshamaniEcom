"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface TransitionState {
  isTransitioning: boolean;
  clickPosition: { x: number; y: number } | null;
  productId: string | null;
}

interface TransitionContextType {
  transitionState: TransitionState;
  startTransition: (productId: string, clickPosition: { x: number; y: number }) => void;
  endTransition: () => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    clickPosition: null,
    productId: null,
  });

  const startTransition = (productId: string, clickPosition: { x: number; y: number }) => {
    setTransitionState({
      isTransitioning: true,
      clickPosition,
      productId,
    });
  };

  const endTransition = () => {
    setTransitionState({
      isTransitioning: false,
      clickPosition: null,
      productId: null,
    });
  };

  return (
    <TransitionContext.Provider value={{ transitionState, startTransition, endTransition }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within TransitionProvider");
  }
  return context;
}











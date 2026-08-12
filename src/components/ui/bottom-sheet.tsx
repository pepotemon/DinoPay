"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  zIndex = "z-[240]",
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Mount / unmount with animation (double rAF = DOM first, then CSS transition)
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Browser back button — close sheet before navigating
  useEffect(() => {
    if (!open) return;
    history.pushState(null, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, onClose]);

  if (!mounted) return null;

  const ease: React.CSSProperties = {
    transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)",
    transitionDuration: "280ms",
  };

  return createPortal(
    <div className={cn("fixed inset-0", zIndex)} role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={ease}
        onClick={onClose}
      />
      {/* Sheet panel */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col",
          "rounded-t-[28px] bg-background shadow-[0_-8px_32px_rgba(0,0,0,0.14)]",
          "transition-transform",
          visible ? "translate-y-0" : "translate-y-full"
        )}
        style={ease}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/25" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

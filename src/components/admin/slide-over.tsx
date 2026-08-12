"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer
}: SlideOverProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // double rAF — ensure DOM is painted before starting transition
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  const ease: React.CSSProperties = {
    transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)",
    transitionDuration: "280ms"
  };

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-black/35 transition-opacity",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={ease}
        onClick={onClose}
      />

      {/* Panel — single element, responsive via Tailwind */}
      <div
        className={cn(
          // shared
          "absolute flex flex-col bg-background shadow-2xl",
          // mobile: bottom sheet
          "inset-x-0 bottom-0 h-[92dvh] rounded-t-[30px] border-t border-border/40",
          // desktop: right slide panel
          "lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:h-full lg:w-[560px]",
          "lg:rounded-t-none lg:rounded-l-[32px] lg:border-t-0 lg:border-l lg:border-border/40",
          // animation
          "transition-transform",
          visible
            ? "translate-x-0 translate-y-0"
            : "max-lg:translate-y-full lg:translate-x-full"
        )}
        style={ease}
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 shrink-0 border-b border-border/50 px-5 pt-3 pb-4 lg:px-7 lg:pt-7 lg:pb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            {description != null ? (
              <div className="mt-1 text-sm text-muted-foreground">{description}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>

        {/* Footer (optional, fixed at bottom) */}
        {footer ? (
          <div className="shrink-0 border-t border-border/50 px-5 py-4 lg:px-7">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

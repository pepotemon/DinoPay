import {
  BarChart3,
  ClipboardList,
  PlusCircle,
  Receipt,
  Route,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageDinoVariant = "available" | "new" | "route" | "expenses" | "reports" | "flow";

type PageDinoProps = {
  variant: PageDinoVariant;
  label: string;
  className?: string;
};

const VARIANT_STYLE: Record<
  PageDinoVariant,
  {
    bg: string;
    accent: string;
    badge: string;
    icon: typeof Users;
    frame: string;
    animation: string;
    shadow: string;
  }
> = {
  available: {
    bg: "bg-emerald-50",
    accent: "bg-emerald-400",
    badge: "bg-emerald-500 text-white",
    icon: Users,
    frame: "0 0",
    animation: "dino-page-wiggle 1.8s ease-in-out infinite",
    shadow: "shadow-emerald-200/80"
  },
  new: {
    bg: "bg-violet-50",
    accent: "bg-primary",
    badge: "bg-primary text-white",
    icon: PlusCircle,
    frame: "-132px 0",
    animation: "dino-page-hop 1.1s ease-in-out infinite",
    shadow: "shadow-primary/20"
  },
  route: {
    bg: "bg-sky-50",
    accent: "bg-sky-400",
    badge: "bg-sky-500 text-white",
    icon: Route,
    frame: "-88px 0",
    animation: "dino-page-run 0.26s steps(1) infinite",
    shadow: "shadow-sky-200/80"
  },
  expenses: {
    bg: "bg-rose-50",
    accent: "bg-rose-400",
    badge: "bg-rose-500 text-white",
    icon: Receipt,
    frame: "-176px 0",
    animation: "dino-page-wiggle 1.5s ease-in-out infinite",
    shadow: "shadow-rose-200/80"
  },
  reports: {
    bg: "bg-amber-50",
    accent: "bg-amber-400",
    badge: "bg-amber-500 text-white",
    icon: BarChart3,
    frame: "-220px 0",
    animation: "dino-page-hop 1.4s ease-in-out infinite",
    shadow: "shadow-amber-200/80"
  },
  flow: {
    bg: "bg-fuchsia-50",
    accent: "bg-fuchsia-400",
    badge: "bg-fuchsia-500 text-white",
    icon: ClipboardList,
    frame: "-88px 0",
    animation: "dino-page-run 0.3s steps(1) infinite",
    shadow: "shadow-fuchsia-200/80"
  }
};

export function PageDino({ variant, label, className }: PageDinoProps) {
  const style = VARIANT_STYLE[variant];
  const Icon = style.icon;

  return (
    <div
      aria-label={label}
      className={cn(
        "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl shadow-lg",
        style.bg,
        style.shadow,
        className
      )}
      role="img"
    >
      <style>{`
        @keyframes dino-page-run {
          0%, 49% { background-position: -88px 0; }
          50%, 100% { background-position: -132px 0; }
        }
        @keyframes dino-page-hop {
          0%, 100% { transform: translateY(0); }
          45% { transform: translateY(-4px); }
        }
        @keyframes dino-page-wiggle {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(-4deg); }
          70% { transform: rotate(3deg); }
        }
        @keyframes dino-page-ground {
          from { transform: translateX(0); }
          to { transform: translateX(-22px); }
        }
      `}</style>

      <span className={cn("absolute left-2 top-2 h-2 w-2 rounded-full", style.accent)} />
      <span className={cn("absolute right-2 top-2 h-2 w-5 rounded-full", style.accent)} />

      <span className="absolute bottom-2 left-1/2 h-[47px] w-[44px] -translate-x-1/2">
        <span
          className="block h-[47px] w-[44px]"
          style={{
            animation: style.animation,
            backgroundImage: "url('/assets/chrome-trex.png')",
            backgroundPosition: style.frame,
            backgroundRepeat: "no-repeat",
            backgroundSize: "264px 47px",
            imageRendering: "pixelated"
          }}
        />
      </span>

      <span className="absolute bottom-1 left-0 right-0 overflow-hidden">
        <span
          className="flex w-28 gap-2"
          style={{ animation: "dino-page-ground 0.8s linear infinite" }}
        >
          <span className="h-0.5 w-6 bg-border/80" />
          <span className="h-0.5 w-8 bg-border/80" />
          <span className="h-0.5 w-5 bg-border/80" />
        </span>
      </span>

      <span
        className={cn(
          "absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full",
          style.badge
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

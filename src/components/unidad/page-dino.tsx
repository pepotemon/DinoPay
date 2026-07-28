import {
  Banknote,
  BarChart3,
  CalendarRange,
  ClipboardList,
  MapPin,
  PlusCircle,
  Receipt,
  Route,
  UserRound,
  Users,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageDinoVariant = "available" | "new" | "route" | "expenses" | "reports" | "flow";

type PageDinoProps = {
  variant: PageDinoVariant;
  label: string;
  className?: string;
};

type VariantScene = {
  frame: string;
  dinoMotion: string;
  symbols: [LucideIcon, LucideIcon, LucideIcon];
};

const SCENES: Record<PageDinoVariant, VariantScene> = {
  available: {
    frame: "0 0",
    dinoMotion: "dino-scene-look 1.8s ease-in-out infinite",
    symbols: [UserRound, Users, PlusCircle]
  },
  new: {
    frame: "-132px 0",
    dinoMotion: "dino-scene-hop 1.15s ease-in-out infinite",
    symbols: [PlusCircle, Banknote, UserRound]
  },
  route: {
    frame: "-88px 0",
    dinoMotion: "dino-scene-run 0.26s steps(1) infinite",
    symbols: [Users, Route, MapPin]
  },
  expenses: {
    frame: "-176px 0",
    dinoMotion: "dino-scene-look 1.5s ease-in-out infinite",
    symbols: [Receipt, Banknote, PlusCircle]
  },
  reports: {
    frame: "-220px 0",
    dinoMotion: "dino-scene-hop 1.35s ease-in-out infinite",
    symbols: [BarChart3, Receipt, CalendarRange]
  },
  flow: {
    frame: "-88px 0",
    dinoMotion: "dino-scene-run 0.3s steps(1) infinite",
    symbols: [ClipboardList, Banknote, BarChart3]
  }
};

export function PageDino({ variant, label, className }: PageDinoProps) {
  const scene = SCENES[variant];
  const [FirstIcon, SecondIcon, ThirdIcon] = scene.symbols;

  return (
    <div
      aria-label={label}
      className={cn("relative h-[74px] w-[92px] shrink-0 overflow-visible", className)}
      role="img"
    >
      <style>{`
        @keyframes dino-scene-run {
          0%, 49% { background-position: -88px 0; }
          50%, 100% { background-position: -132px 0; }
        }
        @keyframes dino-scene-hop {
          0%, 100% { transform: translateY(0); }
          45% { transform: translateY(-5px); }
        }
        @keyframes dino-scene-look {
          0%, 100% { transform: rotate(0deg); }
          40% { transform: rotate(-3deg); }
          72% { transform: rotate(2deg); }
        }
        @keyframes dino-scene-ground {
          from { transform: translateX(0); }
          to { transform: translateX(-24px); }
        }
        @keyframes dino-scene-symbol-one {
          0%, 18%, 100% { opacity: 0; transform: translate3d(4px, 8px, 0) scale(.7); }
          30%, 54% { opacity: 1; transform: translate3d(-2px, -2px, 0) scale(1); }
          70% { opacity: 0; transform: translate3d(-12px, -12px, 0) scale(.86); }
        }
        @keyframes dino-scene-symbol-two {
          0%, 36%, 100% { opacity: 0; transform: translate3d(-6px, 7px, 0) scale(.72); }
          48%, 68% { opacity: 1; transform: translate3d(0, -3px, 0) scale(1); }
          84% { opacity: 0; transform: translate3d(10px, -13px, 0) scale(.86); }
        }
        @keyframes dino-scene-symbol-three {
          0%, 55%, 100% { opacity: 0; transform: translate3d(0, 6px, 0) scale(.72); }
          66%, 82% { opacity: 1; transform: translate3d(0, -2px, 0) scale(1); }
          96% { opacity: 0; transform: translate3d(7px, -12px, 0) scale(.86); }
        }
      `}</style>

      <span className="pointer-events-none absolute left-0 top-1 text-primary">
        <FirstIcon
          className="h-4 w-4"
          style={{ animation: "dino-scene-symbol-one 2.6s ease-in-out infinite" }}
        />
      </span>
      <span className="pointer-events-none absolute right-2 top-0 text-primary">
        <SecondIcon
          className="h-4 w-4"
          style={{ animation: "dino-scene-symbol-two 2.6s ease-in-out infinite" }}
        />
      </span>
      <span className="pointer-events-none absolute right-0 top-7 text-primary">
        <ThirdIcon
          className="h-4 w-4"
          style={{ animation: "dino-scene-symbol-three 2.6s ease-in-out infinite" }}
        />
      </span>

      <span className="absolute bottom-3 left-6 h-[47px] w-[44px]">
        <span
          className="block h-[47px] w-[44px]"
          style={{
            animation: scene.dinoMotion,
            backgroundImage: "url('/assets/chrome-trex.png')",
            backgroundPosition: scene.frame,
            backgroundRepeat: "no-repeat",
            backgroundSize: "264px 47px",
            imageRendering: "pixelated"
          }}
        />
      </span>

      <span className="absolute bottom-1 left-1 right-0 overflow-hidden">
        <span
          className="flex w-32 gap-2"
          style={{ animation: "dino-scene-ground 0.72s linear infinite" }}
        >
          <span className="h-0.5 w-6 bg-border" />
          <span className="h-0.5 w-8 bg-border" />
          <span className="h-0.5 w-5 bg-border" />
          <span className="h-0.5 w-7 bg-border" />
        </span>
      </span>
    </div>
  );
}

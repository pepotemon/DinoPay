export function PageSpinner() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-3 px-4">
      <style>{`
        @keyframes chrome-trex-run {
          0%, 49% { background-position: -176px 0; }
          50%, 100% { background-position: -264px 0; }
        }
        @keyframes chrome-trex-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes chrome-trex-ground {
          from { transform: translateX(0); }
          to { transform: translateX(-32px); }
        }
      `}</style>

      <div className="relative h-24 w-32 overflow-hidden" role="img" aria-label="Cargando">
        <div
          className="absolute left-5 top-0 h-[94px] w-[88px]"
          style={{
            animation:
              "chrome-trex-run 0.22s steps(1) infinite, chrome-trex-bob 0.34s steps(2) infinite",
            backgroundImage: "url('/assets/chrome-trex.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "528px 94px",
            imageRendering: "pixelated"
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <div
            className="flex w-[192px] gap-4"
            style={{ animation: "chrome-trex-ground 0.55s linear infinite" }}
          >
            <span className="h-0.5 w-8 bg-border" />
            <span className="h-0.5 w-12 bg-border" />
            <span className="h-0.5 w-10 bg-border" />
            <span className="h-0.5 w-14 bg-border" />
            <span className="h-0.5 w-8 bg-border" />
          </div>
        </div>
      </div>

      <p className="animate-pulse text-xs font-bold text-muted-foreground">Cargando...</p>
    </div>
  );
}

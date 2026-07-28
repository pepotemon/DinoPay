function PixelDino({ frame }: { frame: "a" | "b" }) {
  const legA = frame === "a";

  return (
    <g fill="hsl(var(--primary))">
      <rect height="6" width="6" x="18" y="52" />
      <rect height="6" width="6" x="24" y="48" />
      <rect height="6" width="6" x="30" y="44" />
      <rect height="6" width="6" x="36" y="40" />

      <rect height="24" width="42" x="42" y="34" />
      <rect height="12" width="54" x="36" y="40" />
      <rect height="12" width="12" x="78" y="28" />

      <rect height="30" width="36" x="84" y="10" />
      <rect height="18" width="24" x="120" y="16" />
      <rect height="6" width="12" x="114" y="34" />
      <rect height="6" width="6" x="138" y="34" />
      <rect height="6" width="6" x="108" y="16" fill="hsl(var(--background))" />
      <rect height="3" width="3" x="111" y="19" fill="hsl(var(--foreground))" />

      <rect height="6" width="12" x="84" y="46" />
      <rect height="6" width="6" x="96" y="52" />

      {legA ? (
        <>
          <rect height="16" width="7" x="48" y="58" />
          <rect height="5" width="15" x="48" y="72" />
          <rect height="10" width="7" x="72" y="58" />
          <rect height="5" width="8" x="79" y="68" />
        </>
      ) : (
        <>
          <rect height="10" width="7" x="48" y="58" />
          <rect height="5" width="10" x="38" y="68" />
          <rect height="16" width="7" x="72" y="58" />
          <rect height="5" width="15" x="64" y="72" />
        </>
      )}
    </g>
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <svg
        aria-label="Cargando"
        className="h-16 w-32"
        fill="none"
        role="img"
        viewBox="0 0 164 92"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes dino-frame-a {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
          @keyframes dino-frame-b {
            0%, 49% { opacity: 0; }
            50%, 100% { opacity: 1; }
          }
          @keyframes dino-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          @keyframes track {
            from { transform: translateX(0); }
            to { transform: translateX(-34px); }
          }
          .dino {
            animation: dino-bob 0.36s steps(2) infinite;
            transform-box: fill-box;
            transform-origin: center;
          }
          .frame-a { animation: dino-frame-a 0.36s steps(1) infinite; }
          .frame-b { animation: dino-frame-b 0.36s steps(1) infinite; }
          .track { animation: track 0.62s linear infinite; }
        `}</style>

        <g className="track" stroke="hsl(var(--border))" strokeLinecap="square" strokeWidth="3">
          <path d="M4 82H28" />
          <path d="M42 82H72" />
          <path d="M88 82H122" />
          <path d="M138 82H170" />
          <path d="M184 82H218" />
        </g>

        <g className="dino">
          <g className="frame-a">
            <PixelDino frame="a" />
          </g>
          <g className="frame-b">
            <PixelDino frame="b" />
          </g>
        </g>
      </svg>

      <p className="animate-pulse text-xs font-bold text-muted-foreground">Cargando...</p>
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <svg
        aria-label="Cargando"
        className="h-16 w-28"
        fill="none"
        role="img"
        viewBox="0 0 128 72"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes dino-hop {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          @keyframes run-a {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
          @keyframes run-b {
            0%, 49% { opacity: 0; }
            50%, 100% { opacity: 1; }
          }
          @keyframes track {
            from { transform: translateX(0); }
            to { transform: translateX(-32px); }
          }
          .track { animation: track 0.55s linear infinite; }
          .dino { animation: dino-hop 0.34s steps(2) infinite; }
          .run-a { animation: run-a 0.34s steps(1) infinite; }
          .run-b { animation: run-b 0.34s steps(1) infinite; }
        `}</style>

        <g className="track" stroke="hsl(var(--border))" strokeLinecap="square" strokeWidth="3">
          <path d="M0 63H24" />
          <path d="M36 63H68" />
          <path d="M82 63H116" />
          <path d="M132 63H164" />
        </g>

        <g className="dino" fill="hsl(var(--primary))">
          <path d="M28 46H36V38H44V30H52V18H60V10H92V18H100V34H84V38H72V46H64V54H52V50H40V46H32V54H24V50H16V46H8V42H16V38H24V42H28V46Z" />
          <rect height="8" width="12" x="92" y="26" />
          <rect height="4" width="4" x="84" y="18" fill="hsl(var(--background))" />
          <rect height="3" width="3" x="88" y="21" fill="hsl(var(--foreground))" />

          <g className="run-a">
            <rect height="10" width="6" x="42" y="52" />
            <rect height="4" width="12" x="42" y="60" />
            <rect height="10" width="6" x="60" y="52" />
            <rect height="4" width="6" x="66" y="60" />
          </g>

          <g className="run-b">
            <rect height="10" width="6" x="42" y="52" />
            <rect height="4" width="6" x="36" y="60" />
            <rect height="10" width="6" x="60" y="52" />
            <rect height="4" width="12" x="54" y="60" />
          </g>
        </g>
      </svg>

      <p className="animate-pulse text-xs font-bold text-muted-foreground">Cargando...</p>
    </div>
  );
}

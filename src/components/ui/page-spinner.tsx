export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <svg
        aria-label="Cargando"
        className="h-20 w-28"
        fill="none"
        role="img"
        viewBox="0 0 160 110"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes dino-walk {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes leg-a {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(9px); }
          }
          @keyframes leg-b {
            0%, 100% { transform: translateY(9px); }
            50% { transform: translateY(0); }
          }
          @keyframes ground {
            0% { transform: translateX(0); }
            100% { transform: translateX(-36px); }
          }
          .dino-body {
            animation: dino-walk 0.5s ease-in-out infinite;
          }
          .leg-a {
            animation: leg-a 0.5s steps(1) infinite;
          }
          .leg-b {
            animation: leg-b 0.5s steps(1) infinite;
          }
          .ground {
            animation: ground 0.7s linear infinite;
          }
        `}</style>

        <g className="ground" stroke="hsl(var(--border))" strokeLinecap="round" strokeWidth="5">
          <path d="M8 94H42" />
          <path d="M58 94H98" />
          <path d="M116 94H158" />
          <path d="M174 94H212" />
        </g>

        <g className="dino-body" fill="hsl(var(--primary))">
          <path d="M36 62H52V48H64V34H86V22H124V34H132V54H110V62H96V76H86V86H74V76H54V86H42V76H36V62Z" />
          <rect height="10" width="12" x="116" y="54" />
          <rect height="8" width="10" x="26" y="56" />
          <rect height="8" width="8" x="18" y="48" />
          <rect height="7" width="7" x="110" y="31" fill="white" />
          <rect height="4" width="4" x="113" y="34" fill="hsl(var(--foreground))" />
          <rect className="leg-a" height="16" width="9" x="57" y="78" />
          <rect className="leg-b" height="16" width="9" x="78" y="78" />
        </g>
      </svg>

      <p className="animate-pulse text-xs font-bold text-muted-foreground">Cargando...</p>
    </div>
  );
}

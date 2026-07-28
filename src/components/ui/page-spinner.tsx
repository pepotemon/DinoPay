export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <svg
        fill="none"
        height="126"
        viewBox="0 0 200 140"
        width="180"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes dino-chomp {
            0%, 100% { transform: rotate(0deg); }
            50%       { transform: rotate(16deg); }
          }
          .dino-jaw {
            animation: dino-chomp 0.48s ease-in-out infinite;
            transform-origin: 112px 82px;
          }
        `}</style>

        {/* ── Head ── */}
        <rect fill="hsl(var(--primary))" height="95" rx="22" width="108" x="8" y="12" />

        {/* ── Brow ── */}
        <path
          d="M38,32 Q52,25 65,32"
          fill="none"
          stroke="#166534"
          strokeLinecap="round"
          strokeWidth="4.5"
        />

        {/* ── Eye ── */}
        <circle cx="52" cy="47" fill="white" r="16" />
        <circle cx="55" cy="49" fill="#111" r="10" />
        <circle cx="58" cy="46" fill="white" r="4" />

        {/* ── Upper snout ── */}
        <rect fill="hsl(var(--primary))" height="24" rx="10" width="76" x="108" y="58" />

        {/* ── Nostril ── */}
        <circle cx="166" cy="67" fill="#166534" r="5" />

        {/* ── Upper teeth (fixed, point down) ── */}
        <polygon fill="white" points="116,82 120,93 124,82" />
        <polygon fill="white" points="127,82 131,93 135,82" />
        <polygon fill="white" points="138,82 142,93 146,82" />
        <polygon fill="white" points="149,82 153,93 157,82" />
        <polygon fill="white" points="160,82 164,93 168,82" />

        {/* ── Lower jaw (chomps) ── */}
        <g className="dino-jaw">
          <rect fill="hsl(var(--primary))" height="20" rx="10" width="76" x="108" y="84" />
          {/* Lower teeth (point up) */}
          <polygon fill="white" points="118,84 122,73 126,84" />
          <polygon fill="white" points="129,84 133,73 137,84" />
          <polygon fill="white" points="140,84 144,73 148,84" />
          <polygon fill="white" points="151,84 155,73 159,84" />
        </g>
      </svg>

      <p className="animate-pulse text-xs font-bold text-muted-foreground">Cargando…</p>
    </div>
  );
}

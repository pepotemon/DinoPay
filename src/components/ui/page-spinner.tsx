export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <svg
        fill="none"
        height="90"
        viewBox="0 0 140 90"
        width="140"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes dino-chomp {
            0%, 100% { transform: rotate(0deg); }
            50%       { transform: rotate(22deg); }
          }
          @keyframes dino-blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95%            { transform: scaleY(0.1); }
          }
          .dino-lower-jaw {
            animation: dino-chomp 0.5s ease-in-out infinite;
            transform-origin: 84px 60px;
          }
          .dino-eye-lid {
            animation: dino-blink 3s ease-in-out infinite;
            transform-origin: 54px 32px;
          }
        `}</style>

        {/* ── Neck stub ── */}
        <path
          d="M10,76 Q18,84 44,82 L48,68 Q30,76 24,62 Z"
          fill="hsl(var(--primary))"
        />

        {/* ── Main head ── */}
        <path
          d="M24,62 Q16,14 58,8 Q92,4 94,48 L94,60 Q62,68 24,62 Z"
          fill="hsl(var(--primary))"
        />

        {/* ── Scales / texture (subtle darker lines) ── */}
        <path d="M38,36 Q44,32 50,36" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
        <path d="M32,50 Q40,46 48,50" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>

        {/* ── Head spikes ── */}
        <polygon points="60,8 66,0 72,9"  fill="#15803d" />
        <polygon points="48,10 53,2 58,10" fill="#15803d" />
        <polygon points="70,10 75,3 80,10" fill="#15803d" />

        {/* ── Upper snout ── */}
        <path
          d="M84,52 Q112,48 122,57 L122,63 Q112,65 84,61 Z"
          fill="hsl(var(--primary))"
        />

        {/* ── Upper teeth (fixed, hang down) ── */}
        <polygon points="86,61 89,70 92,61" fill="white" />
        <polygon points="93,61 96,70 99,61" fill="white" />
        <polygon points="100,61 103,70 106,61" fill="white" />
        <polygon points="107,61 110,70 113,61" fill="white" />

        {/* ── Lower jaw (chomps) ── */}
        <g className="dino-lower-jaw">
          <path
            d="M84,63 Q112,63 122,63 L122,76 Q112,79 84,71 Z"
            fill="hsl(var(--primary))"
          />
          {/* Lower teeth (point up) */}
          <polygon points="87,63 90,54 93,63" fill="white" />
          <polygon points="94,63 97,54 100,63" fill="white" />
          <polygon points="101,63 104,54 107,63" fill="white" />
          <polygon points="108,63 111,54 114,63" fill="white" />
        </g>

        {/* ── Eye ── */}
        <circle cx="54" cy="32" r="11" fill="white" />
        <circle cx="56" cy="33" r="7"  fill="#111" />
        {/* Pupil highlight */}
        <circle cx="58" cy="30" r="3"  fill="white" />
        {/* Eyelid (blinks) */}
        <ellipse className="dino-eye-lid" cx="54" cy="23" rx="11" ry="10" fill="hsl(var(--primary))" />

        {/* ── Nostril ── */}
        <ellipse cx="91" cy="45" rx="4" ry="3" fill="#14532d" />

        {/* ── Brow (mean/determined) ── */}
        <path
          d="M44,22 Q54,17 63,22"
          stroke="#14532d"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── Small arm ── */}
        <path
          d="M30,65 Q24,70 28,76 Q32,78 34,74 Q30,72 32,68 Z"
          fill="hsl(var(--primary))"
        />
        <path d="M28,76 L26,80 M32,78 L31,82 M34,74 L37,77" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>

      <p className="animate-pulse text-xs font-bold text-muted-foreground">Cargando…</p>
    </div>
  );
}

import { useId } from "react";

/**
 * Hand-drawn SVG: Cao Bằng mountains at dusk with a red neckerchief. It fills its container
 * (cover / card art). Drawn for this project, so it carries no archive-photo copyright; swap in
 * a real photo later.
 */
export function KimDongArt({ className }: { className?: string }) {
  // Unique gradient id: the art can appear several times on one page.
  const skyId = useId();
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label="Minh họa: núi rừng Cao Bằng lúc chiều tối và chiếc khăn quàng đỏ"
      preserveAspectRatio="xMidYMid slice"
      className={className ?? "size-full"}
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6b26b" />
          <stop offset="0.55" stopColor="#c0504d" />
          <stop offset="1" stopColor="#3b2a4a" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${skyId})`} />
      <circle cx="236" cy="62" r="26" fill="#ffe8a3" opacity="0.9" />
      <path d="M0 140 L48 82 L86 122 L132 64 L190 128 L238 92 L320 150 V200 H0 Z" fill="#2b3a55" />
      <path
        d="M0 160 L60 114 L110 150 L170 104 L230 152 L290 120 L320 140 V200 H0 Z"
        fill="#1d2a3d"
      />
      <path d="M0 200 V176 Q80 156 160 174 T320 168 V200 Z" fill="#14231a" />
      <path
        d="M118 200 Q150 176 176 158 Q192 148 206 138"
        fill="none"
        stroke="#4aa3df"
        strokeWidth="9"
        opacity="0.8"
      />
      {/* Red neckerchief (khăn quàng đỏ) */}
      <g transform="translate(160 92)">
        <path d="M-46 -22 L46 -22 L0 56 Z" fill="#d62828" stroke="#7a0f0f" strokeWidth="2" />
        <path d="M-46 -22 Q0 -10 46 -22" fill="none" stroke="#7a0f0f" strokeWidth="2" />
        <circle cx="0" cy="-16" r="7" fill="#b21f1f" stroke="#7a0f0f" strokeWidth="2" />
      </g>
    </svg>
  );
}

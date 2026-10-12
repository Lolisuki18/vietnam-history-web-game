import type { SVGProps } from "react";

interface DongSonDrumProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Detailed SVG illustration of the iconic Dong Son Bronze Drum (Trống Đồng Đông Sơn).
 * Features the central 14-point star/sunburst, geometric concentric circles,
 * sawtooth borders, and stylized flying Lac birds (Chim Lạc).
 */
export function DongSonDrum({ size = 120, className, ...props }: DongSonDrumProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Họa tiết Trống đồng Đông Sơn"
      className={className}
      {...props}
    >
      {/* Outer rim */}
      <circle cx="100" cy="100" r="96" strokeWidth="1.5" opacity="0.4" />
      <circle cx="100" cy="100" r="92" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="86" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

      {/* Ring 1: Flying Lac Birds ring */}
      <circle cx="100" cy="100" r="82" strokeWidth="1.5" />
      <g strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
        {/* 4 Stylized flying Lac birds flying counter-clockwise */}
        {[0, 90, 180, 270].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 100 100)`}>
            {/* Lac bird body, beak and sweeping feathers */}
            <path
              d="M 100 20 Q 115 17 126 19 Q 120 23 108 24 Q 96 24 88 28 Q 78 30 70 35 Q 82 28 94 25 Z"
              fill="currentColor"
              fillOpacity="0.25"
            />
            <path d="M 126 19 L 132 18" />
            <path d="M 108 24 Q 102 32 94 36" />
          </g>
        ))}
      </g>
      <circle cx="100" cy="100" r="74" strokeWidth="1.5" />

      {/* Ring 2: Concentric dots and small sawtooth */}
      <circle cx="100" cy="100" r="70" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
      <circle cx="100" cy="100" r="66" strokeWidth="1.5" />

      {/* Ring 3: Tangent circle spiral chain */}
      <g opacity="0.6">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <circle
            key={angle}
            cx={100 + 58 * Math.cos((angle * Math.PI) / 180)}
            cy={100 + 58 * Math.sin((angle * Math.PI) / 180)}
            r="3.5"
            strokeWidth="1.2"
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="50" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="45" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <circle cx="100" cy="100" r="41" strokeWidth="1.5" />

      {/* Center: 14-pointed Star (Sunburst) */}
      <g fill="currentColor" fillOpacity="0.85">
        <polygon
          points="
            100,61 103,72 114,64 112,75 125,71 119,81 133,81 123,89 137,93 124,98
            137,104 123,108 133,116 119,116 125,126 112,122 114,133 103,125 100,136
            97,125 86,133 88,122 75,126 81,116 67,116 77,108 63,104 76,98
            63,93 77,89 67,81 81,81 75,71 88,75 86,64 97,72
          "
        />
      </g>

      {/* Central circular hub */}
      <circle cx="100" cy="100" r="9" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="3.5" fill="currentColor" />
    </svg>
  );
}

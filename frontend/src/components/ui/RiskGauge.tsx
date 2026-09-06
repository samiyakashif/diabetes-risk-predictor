"use client";

import type { RiskLevel } from "@/types/prediction";
import { RISK_CONFIG } from "@/types/prediction";
import { RiskBadge } from "./RiskBadge";

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const config = RISK_CONFIG[level];
  const r = 80;
  const cx = 110;
  const cy = 100;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = (angle: number) => cx + r * Math.cos(toRad(angle));
  const arcY = (angle: number) => cy - r * Math.sin(toRad(angle));

  const fillAngle = 180 - (score / 100) * 180;
  const nx = cx + (r - 12) * Math.cos(toRad(fillAngle));
  const ny = cy - (r - 12) * Math.sin(toRad(fillAngle));

  return (
    <div className="flex flex-col items-center">
      <svg
        width="220"
        height="120"
        viewBox="0 0 220 120"
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <path
          d={`M ${arcX(180)} ${arcY(180)} A ${r} ${r} 0 0 1 ${arcX(0)} ${arcY(0)}`}
          fill="none"
          stroke="#DDD9D4"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d={`M ${arcX(180)} ${arcY(180)} A ${r} ${r} 0 0 1 ${arcX(120)} ${arcY(120)}`}
          fill="none"
          stroke="#2A9E6B"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.25"
        />
        <path
          d={`M ${arcX(120)} ${arcY(120)} A ${r} ${r} 0 0 1 ${arcX(60)} ${arcY(60)}`}
          fill="none"
          stroke="#C8821A"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.25"
        />
        <path
          d={`M ${arcX(60)} ${arcY(60)} A ${r} ${r} 0 0 1 ${arcX(0)} ${arcY(0)}`}
          fill="none"
          stroke="#C0453A"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.25"
        />
        <path
          d={`M ${arcX(180)} ${arcY(180)} A ${r} ${r} 0 ${score > 50 ? 0 : 0} 1 ${arcX(fillAngle)} ${arcY(fillAngle)}`}
          fill="none"
          stroke={config.color}
          strokeWidth="18"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#3A4E50"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill="#3A4E50" />
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill={config.color}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 35}
          textAnchor="middle"
          fontSize="10"
          fill="#68787A"
        >
          / 100
        </text>
        <text
          x="22"
          y="112"
          fontSize="9"
          fill="#2A9E6B"
          fontWeight="600"
        >
          LOW
        </text>
        <text
          x="88"
          y="112"
          fontSize="9"
          fill="#C8821A"
          fontWeight="600"
        >
          MOD
        </text>
        <text
          x="168"
          y="112"
          fontSize="9"
          fill="#C0453A"
          fontWeight="600"
        >
          HIGH
        </text>
      </svg>
      <RiskBadge level={level} size="lg" />
    </div>
  );
}
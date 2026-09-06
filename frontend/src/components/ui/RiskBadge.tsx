import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/prediction";
import { RISK_CONFIG } from "@/types/prediction";

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "px-2.5 py-1 text-xs font-medium gap-1.5",
  md: "px-3 py-1.5 text-xs font-semibold gap-1.5",
  lg: "px-4 py-2 text-sm font-semibold gap-2",
};

const iconSizes = {
  sm: "text-[10px] leading-none",
  md: "text-[10px] leading-none",
  lg: "text-sm leading-none",
};

export function RiskBadge({ level, size = "sm" }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full",
        sizeStyles[size],
      )}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        className={cn("font-bold flex-shrink-0", iconSizes[size])}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
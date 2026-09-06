import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  color?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "#0D7A8A",
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p
            className="text-xl md:text-2xl font-bold mt-1 text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}14` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      {trend && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp size={12} className="text-green-500" />
          {trend}
        </p>
      )}
    </div>
  );
}
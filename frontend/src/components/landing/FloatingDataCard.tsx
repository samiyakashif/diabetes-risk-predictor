"use client";

interface FloatingDataCardProps {
  style?: React.CSSProperties;
  label: string;
  value: string;
  color: string;
  delay: string;
}

export function FloatingDataCard({
  style,
  label,
  value,
  color,
  delay,
}: FloatingDataCardProps) {
  return (
    <div
      className="absolute bg-white/90 backdrop-blur-sm border border-white shadow-lg rounded-xl px-3 py-2.5 items-center gap-2.5 hidden lg:flex"
      style={{ ...style, animation: `float-card 4s ease-in-out infinite ${delay}`, fontSize: 12 }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}:</span>
      <span
        className="font-bold text-foreground"
        style={{ fontFamily: "var(--font-mono)", color }}
      >
        {value}
      </span>
    </div>
  );
}
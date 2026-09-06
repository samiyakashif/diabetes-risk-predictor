"use client";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ElementType;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground border-primary hover:bg-primary/90 focus:ring-primary",
  secondary: "bg-white text-primary border-[#A8D9E2] hover:bg-secondary focus:ring-primary",
  danger: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 focus:ring-destructive",
  ghost: "bg-transparent text-muted-foreground border-transparent hover:bg-muted focus:ring-primary",
  outline: "bg-white text-foreground border-border hover:bg-muted focus:ring-primary",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer border focus:outline-none focus:ring-2 focus:ring-offset-2",
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
      {children}
    </button>
  );
}
"use client";

import { HelpCircle } from "lucide-react";

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  tooltip?: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  autoComplete?: string;
}

export function InputField({
  label,
  type = "text",
  placeholder,
  tooltip,
  value,
  onChange,
  name,
  required,
  autoComplete,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {tooltip && (
          <div className="relative group">
            <HelpCircle size={13} className="text-muted-foreground cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-foreground text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
      />
    </div>
  );
}
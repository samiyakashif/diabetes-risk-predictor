import Link from "next/link";
import { Activity } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-16 flex items-center px-6 bg-white border-b border-border">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span
            className="font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            DiabetaAI
          </span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
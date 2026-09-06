"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/user";
import {
  Home, Activity, ClipboardList, BookOpen, FileText,
  Settings, LogOut, Stethoscope,
} from "lucide-react";

const PATIENT_NAV = [
  { label: "Dashboard", href: "/patient", icon: Home },
  { label: "Health Input", href: "/patient/health-input", icon: ClipboardList },
  { label: "Prediction", href: "/patient/prediction", icon: Activity },
  { label: "Tracking", href: "/patient/tracking", icon: Activity },
  { label: "Recommendations", href: "/patient/recommendations", icon: BookOpen },
  { label: "Resources", href: "/patient/resources", icon: FileText },
  { label: "Reports", href: "/patient/reports", icon: FileText },
  { label: "Settings", href: "/patient/settings", icon: Settings },
];

const PROVIDER_NAV = [
  { label: "Dashboard", href: "/provider", icon: Home },
  { label: "Clinical Insights", href: "/provider/clinical", icon: Stethoscope },
  { label: "Settings", href: "/provider/settings", icon: Settings },
];

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Model Training", href: "/admin/training", icon: Activity },
  { label: "Evaluation", href: "/admin/evaluation", icon: ClipboardList },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function getNavItems(role: Role) {
  switch (role) {
    case "admin":
      return ADMIN_NAV;
    case "provider":
      return PROVIDER_NAV;
    default:
      return PATIENT_NAV;
  }
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <h2
          className="text-lg font-bold text-sidebar-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DiabetaAI
        </h2>
        <p className="text-xs text-sidebar-foreground mt-0.5 capitalize">
          {role} Portal
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
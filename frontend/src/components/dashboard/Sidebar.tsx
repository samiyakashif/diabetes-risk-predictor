"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/user";
import {
  Activity,
  BarChart2,
  BookOpen,
  Brain,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Settings,
  Star,
  Stethoscope,
  TrendingUp,
} from "lucide-react";

const PATIENT_NAV = [
  { label: "Dashboard", href: "/patient", icon: Home },
  { label: "Health Input", href: "/patient/health-input", icon: ClipboardList },
  { label: "Prediction", href: "/patient/prediction", icon: Activity },
  { label: "Tracking", href: "/patient/tracking", icon: TrendingUp },
  { label: "Recommendations", href: "/patient/recommendations", icon: Star },
  { label: "Resources", href: "/patient/resources", icon: BookOpen },
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
  { label: "Model Training", href: "/admin/training", icon: Brain },
  { label: "Evaluation", href: "/admin/evaluation", icon: BarChart2 },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const NAV_BY_ROLE: Record<NonNullable<Role>, { label: string; href: string; icon: typeof Home }[]> = {
  patient: PATIENT_NAV,
  provider: PROVIDER_NAV,
  admin: ADMIN_NAV,
};

export function Sidebar({ role }: { role: NonNullable<Role> }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const items = NAV_BY_ROLE[role];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <h2
            className="text-lg font-bold text-sidebar-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            DiabetaAI
          </h2>
        </div>
        <p className="text-xs text-sidebar-foreground mt-0.5 capitalize">
          {role} Portal
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
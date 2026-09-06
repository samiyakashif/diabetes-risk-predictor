import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import {
  Activity, AlertCircle, BarChart2, BookOpen, ChevronRight,
  ClipboardList, Database, Download, FileText, Heart, HelpCircle,
  Home, LogOut, Play, RefreshCw, Settings,
  Shield, TrendingUp, Upload, Users, Server,
  CheckCircle, Clock, Zap, Info, Calendar,
  Search, Bell, ChevronDown, Stethoscope,
  Brain, GitBranch, Layers, ArrowRight, Star
} from "lucide-react";

type Page =
  | "landing" | "login" | "register"
  | "patient" | "health-input" | "prediction" | "tracking" | "recommendations" | "resources" | "reports-patient"
  | "provider" | "clinical"
  | "admin" | "training" | "evaluation" | "reports-admin"
  | "settings";

type Role = "patient" | "provider" | "admin" | null;
type RiskLevel = "low" | "moderate" | "high";

interface AppState {
  page: Page;
  role: Role;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; text: string; icon: string }> = {
  low:      { label: "Low Risk",      color: "#2A9E6B", bg: "#EEF9F4", border: "#A8E2C8", text: "#1A6042", icon: "✓" },
  moderate: { label: "Moderate Risk", color: "#C8821A", bg: "#FDF6E8", border: "#F0CF8A", text: "#7A4D0A", icon: "▲" },
  high:     { label: "High Risk",     color: "#C0453A", bg: "#FBF0EF", border: "#F0B8B4", text: "#7A1F1A", icon: "!" },
};

// ─── Shared components ────────────────────────────────────────────────────────

function RiskBadge({ level, size = "sm" }: { level: RiskLevel; size?: "sm" | "md" | "lg" }) {
  const c = RISK_CONFIG[level];
  const sizeClass = size === "lg" ? "px-4 py-2 text-sm font-semibold gap-2" : size === "md" ? "px-3 py-1.5 text-xs font-semibold gap-1.5" : "px-2.5 py-1 text-xs font-medium gap-1.5";
  const iconSize = size === "lg" ? "text-sm leading-none" : "text-[10px] leading-none";
  return (
    <span
      className={cn("inline-flex items-center rounded-full", sizeClass)}
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {/* Icon symbol pairs with color — never color alone (colorblind-safe) */}
      <span className={cn("font-bold flex-shrink-0", iconSize)} aria-hidden="true">{c.icon}</span>
      {c.label}
    </span>
  );
}

function StatCard({
  title, value, subtitle, icon: Icon, trend, color = "#0D7A8A"
}: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; trend?: string; color?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-xl md:text-2xl font-bold mt-1 text-foreground" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}14` }}>
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

function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const c = RISK_CONFIG[level];
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
      <svg width="220" height="120" viewBox="0 0 220 120" style={{ maxWidth: "100%", height: "auto" }}>
        {/* Background arc */}
        <path
          d={`M ${arcX(180)} ${arcY(180)} A ${r} ${r} 0 0 1 ${arcX(0)} ${arcY(0)}`}
          fill="none" stroke="#DDD9D4" strokeWidth="18" strokeLinecap="round"
        />
        {/* Low zone */}
        <path
          d={`M ${arcX(180)} ${arcY(180)} A ${r} ${r} 0 0 1 ${arcX(120)} ${arcY(120)}`}
          fill="none" stroke="#2A9E6B" strokeWidth="18" strokeLinecap="round" opacity="0.25"
        />
        {/* Moderate zone */}
        <path
          d={`M ${arcX(120)} ${arcY(120)} A ${r} ${r} 0 0 1 ${arcX(60)} ${arcY(60)}`}
          fill="none" stroke="#C8821A" strokeWidth="18" strokeLinecap="round" opacity="0.25"
        />
        {/* High zone */}
        <path
          d={`M ${arcX(60)} ${arcY(60)} A ${r} ${r} 0 0 1 ${arcX(0)} ${arcY(0)}`}
          fill="none" stroke="#C0453A" strokeWidth="18" strokeLinecap="round" opacity="0.25"
        />
        {/* Fill arc */}
        <path
          d={`M ${arcX(180)} ${arcY(180)} A ${r} ${r} 0 ${score > 50 ? 0 : 0} 1 ${arcX(fillAngle)} ${arcY(fillAngle)}`}
          fill="none" stroke={c.color} strokeWidth="18" strokeLinecap="round"
        />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#3A4E50" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#3A4E50" />
        {/* Score text */}
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="28" fontWeight="700" fill={c.color} fontFamily="var(--font-display)">{score}</text>
        <text x={cx} y={cy + 35} textAnchor="middle" fontSize="10" fill="#68787A">/ 100</text>
        {/* Labels */}
        <text x="22" y="112" fontSize="9" fill="#2A9E6B" fontWeight="600">LOW</text>
        <text x="88" y="112" fontSize="9" fill="#C8821A" fontWeight="600">MOD</text>
        <text x="168" y="112" fontSize="9" fill="#C0453A" fontWeight="600">HIGH</text>
      </svg>
      <RiskBadge level={level} size="lg" />
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

function Btn({
  children, variant = "primary", size = "md", onClick, className = "", icon: Icon
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg"; onClick?: () => void; className?: string; icon?: React.ElementType;
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer border focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-[#0D7A8A] text-white border-[#0D7A8A] hover:bg-[#0A6070] focus:ring-[#0D7A8A]",
    secondary: "bg-white text-[#0D7A8A] border-[#A8D9E2] hover:bg-[#E8F6F8] focus:ring-[#0D7A8A]",
    danger: "bg-[#C0453A] text-white border-[#C0453A] hover:bg-[#A83830] focus:ring-[#C0453A]",
    ghost: "bg-transparent text-muted-foreground border-transparent hover:bg-muted focus:ring-[#0D7A8A]",
    outline: "bg-white text-foreground border-border hover:bg-muted focus:ring-[#0D7A8A]",
  };
  return (
    <button onClick={onClick} className={cn(base, sizes[size], variants[variant], className)}>
      {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
      {children}
    </button>
  );
}

function InputField({
  label, type = "text", placeholder, tooltip, value, onChange
}: {
  label: string; type?: string; placeholder?: string; tooltip?: string; value?: string; onChange?: (v: string) => void;
}) {
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
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-[#F3F2EF] border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] focus:border-transparent transition-all"
      />
    </div>
  );
}

// ─── Top navigation (public pages) ───────────────────────────────────────────

function TopNav({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border h-16 flex items-center px-6 gap-6">
      <div className="flex items-center gap-2.5 flex-1">
        <div className="w-8 h-8 rounded-lg bg-[#0D7A8A] flex items-center justify-center">
          <Activity size={16} className="text-white" />
        </div>
        <span className="font-bold text-foreground text-lg" style={{ fontFamily: "var(--font-display)" }}>DiabetaAI</span>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
        <a href="#resources" className="hover:text-foreground transition-colors">Resources</a>
      </div>
      <div className="flex items-center gap-2">
        <Btn variant="outline" size="sm" onClick={() => onNavigate("login")}>Log In</Btn>
        <Btn variant="primary" size="sm" onClick={() => onNavigate("register")}><span className="hidden sm:inline">Get Started</span><span className="sm:hidden">Sign Up</span></Btn>
      </div>
    </nav>
  );
}

// ─── Sidebar (dashboard pages) ───────────────────────────────────────────────

const PATIENT_NAV = [
  { id: "patient", label: "Dashboard", icon: Home },
  { id: "health-input", label: "Health Input", icon: ClipboardList },
  { id: "prediction", label: "Predictions", icon: Activity },
  { id: "tracking", label: "Tracking", icon: TrendingUp },
  { id: "recommendations", label: "Recommendations", icon: Star },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "reports-patient", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const PROVIDER_NAV = [
  { id: "provider", label: "Dashboard", icon: Home },
  { id: "clinical", label: "Clinical Insights", icon: Stethoscope },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV = [
  { id: "admin", label: "Dashboard", icon: Home },
  { id: "training", label: "Model Training", icon: Brain },
  { id: "evaluation", label: "Model Evaluation", icon: BarChart2 },
  { id: "reports-admin", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

function Sidebar({
  page, role, onNavigate, onLogout, mobileOpen, onClose, collapsed, onToggleCollapse
}: {
  page: Page; role: Role; onNavigate: (p: Page) => void; onLogout: () => void;
  mobileOpen: boolean; onClose: () => void;
  collapsed: boolean; onToggleCollapse: () => void;
}) {
  const navItems = role === "admin" ? ADMIN_NAV : role === "provider" ? PROVIDER_NAV : PATIENT_NAV;
  const roleLabel = role === "admin" ? "Administrator" : role === "provider" ? "Healthcare Provider" : "Patient";
  const userNames = { admin: "Dr. Admin", provider: "Dr. Sarah Chen", patient: "Alex Johnson" };
  const userName = userNames[role || "patient"];
  const handleNav = (id: Page) => { onNavigate(id); onClose(); };

  return (
    <>
      {/* Keyframes for label slide */}
      <style>{`
        .sb-label {
          transition: opacity 0.22s ease, transform 0.22s ease, width 0.3s cubic-bezier(.4,0,.2,1), max-width 0.3s cubic-bezier(.4,0,.2,1);
          overflow: hidden; white-space: nowrap;
        }
        .sb-label-visible { opacity: 1; transform: translateX(0); max-width: 200px; }
        .sb-label-hidden  { opacity: 0; transform: translateX(-6px); max-width: 0; width: 0; }
        .sb-tooltip {
          position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
          background: #1C2B2D; color: #fff; font-size: 11px; font-weight: 600;
          padding: 5px 10px; border-radius: 7px; white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 0.15s ease; z-index: 100;
        }
        .sb-tooltip::before {
          content: ''; position: absolute; right: 100%; top: 50%; transform: translateY(-50%);
          border: 5px solid transparent; border-right-color: #1C2B2D;
        }
        .sb-nav-item:hover .sb-tooltip { opacity: 1; }
        .sb-chevron { transition: transform 0.3s cubic-bezier(.4,0,.2,1); }
        .sb-chevron-open  { transform: rotate(0deg); }
        .sb-chevron-close { transform: rotate(180deg); }
      `}</style>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col z-50",
          "transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
          // Mobile: slide in from left; Desktop: always visible, width animates
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{ width: collapsed ? 68 : 256 }}
      >
        {/* Logo row */}
        <div className="h-16 flex items-center border-b border-border flex-shrink-0 overflow-hidden"
          style={{ paddingLeft: collapsed ? 18 : 20, paddingRight: collapsed ? 8 : 12 }}>
          <div className="w-8 h-8 rounded-lg bg-[#0D7A8A] flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-white" />
          </div>
          <span className={cn("font-bold text-foreground ml-2.5 sb-label", collapsed ? "sb-label-hidden" : "sb-label-visible")}
            style={{ fontFamily: "var(--font-display)" }}>DiabetaAI</span>
          <button onClick={onClose}
            className={cn("ml-auto lg:hidden w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground text-lg leading-none flex-shrink-0", collapsed && "hidden")}>
            ✕
          </button>
        </div>

        {/* Profile — click to collapse/expand (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center border-b border-border flex-shrink-0 overflow-hidden w-full text-left group hover:bg-[#E8F6F8]/60 transition-colors duration-150"
          style={{ padding: collapsed ? "14px 14px" : "14px 16px", gap: 12, minHeight: 64 }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#CBE9EE] flex items-center justify-center text-[#0D7A8A] font-bold text-sm select-none">
              {userName.charAt(0)}
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#2A9E6B] border-2 border-card" />
          </div>

          {/* Name + role */}
          <div className={cn("min-w-0 flex-1 sb-label", collapsed ? "sb-label-hidden" : "sb-label-visible")}>
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{userName}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{roleLabel}</p>
          </div>

          {/* Chevron indicator */}
        </button>

        {/* Mobile profile (not clickable for collapse) */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-4 border-b border-border flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#CBE9EE] flex items-center justify-center text-[#0D7A8A] font-bold text-sm flex-shrink-0">{userName.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5"
          style={{ paddingLeft: collapsed ? 10 : 12, paddingRight: collapsed ? 10 : 12 }}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <div key={id} className="relative sb-nav-item">
                <button
                  onClick={() => handleNav(id as Page)}
                  className={cn(
                    "w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                    active ? "bg-[#E8F6F8] text-[#0D7A8A]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  style={{ height: 40 }}
                >
                  <Icon size={17} className={cn("flex-shrink-0", active ? "text-[#0D7A8A]" : "")} />
                  <span className={cn("sb-label", collapsed ? "sb-label-hidden" : "sb-label-visible")}>{label}</span>
                </button>
                {/* Tooltip shown only when collapsed (desktop) */}
                {collapsed && <span className="sb-tooltip hidden lg:block">{label}</span>}
              </div>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-border flex-shrink-0 py-3"
          style={{ paddingLeft: collapsed ? 10 : 12, paddingRight: collapsed ? 10 : 12 }}>
          <div className="relative sb-nav-item">
            <button
              onClick={onLogout}
              className={cn(
                "w-full flex items-center rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
              )}
              style={{ height: 40 }}
            >
              <LogOut size={17} className="flex-shrink-0" />
              <span className={cn("sb-label", collapsed ? "sb-label-hidden" : "sb-label-visible")}>Sign Out</span>
            </button>
            {collapsed && <span className="sb-tooltip hidden lg:block">Sign Out</span>}
          </div>
        </div>
      </aside>
    </>
  );
}

function DashboardLayout({
  children, page, role, onNavigate, onLogout
}: {
  children: React.ReactNode; page: Page; role: Role;
  onNavigate: (p: Page) => void; onLogout: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarW = collapsed ? 68 : 256;
  const userNames: Record<string, string> = { admin: "Dr. Admin", provider: "Dr. Sarah Chen", patient: "Alex Johnson" };
  const userName = userNames[role || "patient"];
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        page={page} role={role} onNavigate={onNavigate} onLogout={onLogout}
        mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)}
        collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <style>{`.dash-main { margin-left: 0 } @media(min-width:1024px){ .dash-main { margin-left: ${sidebarW}px; transition: margin-left 0.3s cubic-bezier(.4,0,.2,1); } }`}</style>
      <main className="dash-main flex-1 min-h-screen w-full">
        <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="1.5" rx="0.75" fill="currentColor"/><rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/><rect x="1" y="13.5" width="16" height="1.5" rx="0.75" fill="currentColor"/></svg>
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-6 h-6 rounded-md bg-[#0D7A8A] flex items-center justify-center"><Activity size={12} className="text-white" /></div>
              <span className="font-bold text-sm text-foreground" style={{ fontFamily: "var(--font-display)" }}>DiabetaAI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#CBE9EE] flex items-center justify-center text-[#0D7A8A] font-semibold text-xs lg:hidden">{userName.charAt(0)}</div>
            <button className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors relative">
              <Bell size={16} className="text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C0453A] rounded-full" />
            </button>
            <button onClick={() => onNavigate("settings")} className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
              <Settings size={16} className="text-muted-foreground" />
            </button>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const healthTrendData = [
  { month: "Dec", glucose: 118, bmi: 27.2, risk: 42 },
  { month: "Jan", glucose: 124, bmi: 27.8, risk: 51 },
  { month: "Feb", glucose: 131, bmi: 28.1, risk: 58 },
  { month: "Mar", glucose: 128, bmi: 27.9, risk: 55 },
  { month: "Apr", glucose: 122, bmi: 27.4, risk: 48 },
  { month: "May", glucose: 119, bmi: 27.1, risk: 44 },
];

const riskFactorsData = [
  { name: "Glucose Level", impact: 38, fill: "#C0453A" },
  { name: "BMI", impact: 24, fill: "#C8821A" },
  { name: "Age", impact: 17, fill: "#C8821A" },
  { name: "Blood Pressure", impact: 12, fill: "#E5AC30" },
  { name: "Insulin", impact: 9, fill: "#2A9E6B" },
];

const providerPatients = [
  { id: "P-1042", name: "Maria Santos", age: 54, lastCheck: "2026-05-20", glucose: 148, bmi: 31.2, risk: "high" as RiskLevel },
  { id: "P-1038", name: "James Kowalski", age: 47, lastCheck: "2026-05-19", glucose: 132, bmi: 28.4, risk: "moderate" as RiskLevel },
  { id: "P-1031", name: "Fatima Al-Rashid", age: 62, lastCheck: "2026-05-18", glucose: 158, bmi: 33.1, risk: "high" as RiskLevel },
  { id: "P-1027", name: "David Chen", age: 38, lastCheck: "2026-05-17", glucose: 108, bmi: 24.6, risk: "low" as RiskLevel },
  { id: "P-1019", name: "Aisha Okonkwo", age: 51, lastCheck: "2026-05-15", glucose: 127, bmi: 27.8, risk: "moderate" as RiskLevel },
];

const riskDistData = [
  { name: "Low Risk", value: 38, fill: "#2A9E6B" },
  { name: "Moderate Risk", value: 41, fill: "#C8821A" },
  { name: "High Risk", value: 21, fill: "#C0453A" },
];

const modelMetrics = [
  { model: "Neural Network", accuracy: 94.2, precision: 93.8, recall: 91.4, f1: 92.6, status: "best" },
  { model: "SVM", accuracy: 91.7, precision: 90.2, recall: 89.6, f1: 89.9, status: "trained" },
  { model: "Decision Tree", accuracy: 87.3, precision: 86.1, recall: 88.4, f1: 87.2, status: "trained" },
  { model: "Logistic Reg.", accuracy: 89.1, precision: 88.7, recall: 87.9, f1: 88.3, status: "trained" },
];

const trackingHistory = [
  { date: "May 20, 2026", glucose: 119, bmi: 27.1, bp: "122/78", risk: "low" as RiskLevel, score: 44 },
  { date: "Apr 15, 2026", glucose: 122, bmi: 27.4, bp: "125/80", risk: "low" as RiskLevel, score: 48 },
  { date: "Mar 12, 2026", glucose: 128, bmi: 27.9, bp: "128/82", risk: "moderate" as RiskLevel, score: 55 },
  { date: "Feb 08, 2026", glucose: 131, bmi: 28.1, bp: "131/84", risk: "moderate" as RiskLevel, score: 58 },
  { date: "Jan 14, 2026", glucose: 124, bmi: 27.8, bp: "127/81", risk: "moderate" as RiskLevel, score: 51 },
];

// ─── Pages ────────────────────────────────────────────────────────────────────

// ─── Animated top ticker ─────────────────────────────────────────────────────

const TICKER_ITEMS = [
  { icon: Activity, label: "Live Predictions", value: "1,247 today" },
  { icon: Users, label: "Active Users", value: "8,412" },
  { icon: Shield, label: "Model Accuracy", value: "94.2%" },
  { icon: Heart, label: "Risks Detected", value: "312 this week" },
  { icon: CheckCircle, label: "Reports Generated", value: "2,841" },
  { icon: Brain, label: "ML Models Running", value: "4 in ensemble" },
  { icon: TrendingUp, label: "Risk Reduced", value: "18% avg this month" },
  { icon: Zap, label: "Avg Prediction Time", value: "< 200 ms" },
];

function AnimatedTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full bg-[#0D7A8A] overflow-hidden border-b border-[#0A6070] relative" style={{ height: 38 }}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #0D7A8A, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #0D7A8A, transparent)" }} />
      <div
        className="flex items-center h-full gap-0"
        style={{ animation: "ticker-scroll 32s linear infinite", whiteSpace: "nowrap", width: "max-content" }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-8 h-full border-r border-white/10 flex-shrink-0">
            <item.icon size={12} className="text-white/70" />
            <span className="text-xs text-white/70">{item.label}:</span>
            <span className="text-xs font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>{item.value}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── Floating particle canvas ─────────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#0D7A8A", "#2A9E6B", "#C8821A", "#6264A0"];
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }> = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 3 + 1.5,
      alpha: Math.random() * 0.35 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(26,86,219,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Pulse ring component ─────────────────────────────────────────────────────

function PulseRings() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Soft gradient orbs */}
      <div className="absolute top-[-80px] right-[5%] w-[480px] h-[480px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #0D7A8A 0%, transparent 70%)", animation: "pulse-orb 6s ease-in-out infinite" }} />
      <div className="absolute bottom-[-60px] left-[8%] w-[360px] h-[360px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #2A9E6B 0%, transparent 70%)", animation: "pulse-orb 8s ease-in-out infinite 2s" }} />
      <div className="absolute top-[30%] left-[40%] w-[280px] h-[280px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #6264A0 0%, transparent 70%)", animation: "pulse-orb 10s ease-in-out infinite 1s" }} />
      {/* Expanding rings */}
      <div className="absolute top-[20%] right-[12%]">
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute rounded-full border border-[#0D7A8A]/15"
            style={{
              width: 120 + i * 60, height: 120 + i * 60,
              top: -(60 + i * 30), left: -(60 + i * 30),
              animation: `ring-expand 3.5s ease-out infinite ${i * 1.1}s`
            }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse-orb {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50%       { transform: scale(1.12) translate(12px, -16px); }
        }
        @keyframes ring-expand {
          0%   { opacity: 0.5; transform: scale(0.6); }
          100% { opacity: 0;   transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

// ─── Animated stat counter ────────────────────────────────────────────────────

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1800;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Floating medical data cards ─────────────────────────────────────────────

function FloatingDataCard({ style, label, value, color, delay }: {
  style?: React.CSSProperties; label: string; value: string; color: string; delay: string;
}) {
  return (
    <div
      className="absolute bg-white/90 backdrop-blur-sm border border-white shadow-lg rounded-xl px-3 py-2.5 items-center gap-2.5 hidden lg:flex"
      style={{ ...style, animation: `float-card 4s ease-in-out infinite ${delay}`, fontSize: 12 }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-mono)", color }}>{value}</span>
      <style>{`
        @keyframes float-card {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-8px) rotate(0.5deg); }
          66%       { transform: translateY(-4px) rotate(-0.5deg); }
        }
      `}</style>
    </div>
  );
}

function LandingPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const features = [
    { icon: Activity, title: "AI Prediction", desc: "4 ML models working in ensemble to deliver accurate diabetes risk scores with clinical confidence intervals." },
    { icon: BarChart2, title: "Smart Dashboard", desc: "Personalized health overviews with interactive charts tracking your risk trajectory over time." },
    { icon: Shield, title: "Risk Analysis", desc: "Granular factor-level breakdown showing exactly which biomarkers are driving your risk score." },
    { icon: Star, title: "Recommendations", desc: "Evidence-based lifestyle and clinical recommendations tailored to your individual risk profile." },
    { icon: FileText, title: "Clinical Reports", desc: "Professional PDF reports suitable for sharing with your healthcare provider." },
    { icon: Stethoscope, title: "Provider Tools", desc: "Dedicated dashboard for clinicians to monitor patient panels and access clinical decision support." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Animated ticker */}
      <AnimatedTicker />
      <TopNav onNavigate={onNavigate} />

      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 max-w-6xl mx-auto overflow-hidden">
        {/* Background animations */}
        <PulseRings />
        <ParticleCanvas />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F6F8] border border-[#A8D9E2] text-[#0D7A8A] text-xs font-semibold mb-6"
              style={{ animation: "fade-in-up 0.6s ease both" }}>
              <Zap size={11} />
              Powered by Clinical-Grade Machine Learning
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4 sm:mb-6"
              style={{ fontFamily: "var(--font-display)", animation: "fade-in-up 0.7s ease 0.1s both" }}>
              Predict Your<br />
              <span className="text-[#0D7A8A]" style={{ animation: "shimmer-text 4s ease-in-out infinite" }}>Diabetes Risk</span><br />
              with AI
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              DiabetaAI combines four machine learning models — Neural Network, SVM, Decision Tree, and Logistic Regression — to deliver highly accurate diabetes risk predictions from standard health metrics.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Btn variant="primary" size="lg" onClick={() => onNavigate("register")} icon={ArrowRight}>
                Get Your Risk Score
              </Btn>
              <Btn variant="outline" size="lg" onClick={() => onNavigate("login")}>
                Healthcare Provider Login
              </Btn>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
              style={{ animation: "fade-in-up 0.7s ease 0.35s both" }}>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-[#2A9E6B]" /> HIPAA-aligned</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-[#2A9E6B]" /> <CountUp target={94} suffix="%" /> accuracy</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-[#2A9E6B]" /> Free to use</span>
            </div>

            {/* Animated stat strip */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3" style={{ animation: "fade-in-up 0.7s ease 0.45s both" }}>
              {[
                { label: "Predictions made", value: 48291, suffix: "+" },
                { label: "Users protected", value: 8412, suffix: "" },
                { label: "Risk reductions", value: 76, suffix: "%" },
              ].map(s => (
                <div key={s.label} className="bg-white/80 backdrop-blur-sm rounded-xl border border-border px-3 py-2.5 text-center">
                  <p className="text-lg font-extrabold text-[#0D7A8A]" style={{ fontFamily: "var(--font-display)" }}>
                    <CountUp target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <style>{`
              @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(22px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              @keyframes shimmer-text {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.82; text-shadow: 0 0 32px rgba(26,86,219,0.25); }
              }
            `}</style>
          </div>

          {/* Hero illustration card */}
          <div className="relative" style={{ animation: "fade-in-up 0.8s ease 0.3s both" }}>
            {/* Floating data cards */}
            <FloatingDataCard style={{ top: -18, left: -60 }} label="Glucose" value="131 mg/dL" color="#C8821A" delay="0s" />
            <FloatingDataCard style={{ bottom: 60, left: -72 }} label="HbA1c" value="6.1%" color="#2A9E6B" delay="0.8s" />
            <FloatingDataCard style={{ top: 80, right: -68 }} label="BMI" value="28.1" color="#6264A0" delay="1.4s" />
            <FloatingDataCard style={{ bottom: -16, right: 20 }} label="Risk Δ" value="-12%" color="#2A9E6B" delay="0.4s" />

            <div className="bg-white rounded-2xl border border-border p-6 shadow-xl shadow-[#0D7A8A]/8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">Latest Prediction</span>
                <RiskBadge level="moderate" />
              </div>
              <RiskGauge score={62} level="moderate" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Glucose", value: "131 mg/dL" },
                  { label: "BMI", value: "28.1" },
                  { label: "Blood Pressure", value: "131/84" },
                ].map(m => (
                  <div key={m.label} className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-[#2A9E6B] items-center gap-1.5 hidden md:flex">
              <TrendingUp size={12} /> Risk Down 12% this month
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-foreground items-center gap-1.5 hidden md:flex">
              <Brain size={12} className="text-[#0D7A8A]" /> 4 Models in Ensemble
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 md:py-20 px-4 md:px-6 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>Everything you need to manage diabetes risk</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A complete platform for patients and clinicians, built around evidence-based prediction and actionable insights.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-border hover:border-[#A8D9E2] hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-[#E8F6F8] flex items-center justify-center mb-4 group-hover:bg-[#CBE9EE] transition-colors">
                  <Icon size={18} className="text-[#0D7A8A]" />
                </div>
                <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-12 md:py-20 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>Three steps to your risk score</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
          <div className="absolute top-8 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px bg-[#A8D9E2] hidden sm:block" />
          {[
            { n: "01", title: "Enter Health Data", desc: "Input your basic health metrics — glucose, BMI, blood pressure, and more. Takes under 2 minutes.", icon: ClipboardList },
            { n: "02", title: "AI Analysis", desc: "Our ensemble of 4 ML models analyzes your data against clinical population benchmarks.", icon: Brain },
            { n: "03", title: "Get Insights", desc: "Receive a detailed risk score with factor breakdown, plain-language explanation, and recommendations.", icon: Activity },
          ].map(s => (
            <div key={s.n} className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 rounded-2xl bg-[#0D7A8A] flex items-center justify-center mb-4 shadow-lg shadow-[#0D7A8A]/25 z-10 relative">
                <s.icon size={24} className="text-white" />
              </div>
              <span className="text-xs font-bold text-[#0D7A8A] mb-1">{s.n}</span>
              <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Btn variant="primary" size="lg" onClick={() => onNavigate("register")} icon={ArrowRight}>
            Start for Free
          </Btn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0D7A8A] flex items-center justify-center">
              <Activity size={12} className="text-white" />
            </div>
            <span className="font-semibold text-foreground">DiabetaAI</span>
          </div>
          <p>For informational purposes only. Not a substitute for professional medical advice.</p>
          <p>© 2026 DiabetaAI</p>
        </div>
      </footer>
    </div>
  );
}

function AuthPage({
  mode, onNavigate, setRole
}: {
  mode: "login" | "register"; onNavigate: (p: Page) => void; setRole: (r: Role) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<string>("patient");
  const isLogin = mode === "login";

  const handleSubmit = () => {
    const role = selectedRole as Role;
    setRole(role);
    const dest: Record<string, Page> = { patient: "patient", provider: "provider", admin: "admin" };
    onNavigate(dest[role] || "patient");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-16 flex items-center px-6 bg-white border-b border-border">
        <button onClick={() => onNavigate("landing")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-[#0D7A8A] flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>DiabetaAI</span>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isLogin ? "Sign in to your DiabetaAI account" : "Start predicting your diabetes risk today"}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {!isLogin && <InputField label="Full Name" placeholder="Alex Johnson" />}
              <InputField label="Email address" type="email" placeholder="you@example.com" />
              <InputField label="Password" type="password" placeholder="••••••••" />

              {!isLogin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Role</label>
                  <div className="relative">
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F3F2EF] border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] appearance-none"
                    >
                      <option value="patient">Patient</option>
                      <option value="provider">Healthcare Provider</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Sign in as</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["patient", "provider", "admin"] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setSelectedRole(r)}
                        className={cn(
                          "py-2 px-3 rounded-lg text-xs font-semibold border transition-all capitalize",
                          selectedRole === r
                            ? "bg-[#E8F6F8] text-[#0D7A8A] border-[#A8D9E2]"
                            : "bg-white text-muted-foreground border-border hover:border-[#A8D9E2]"
                        )}
                      >
                        {r === "provider" ? "Provider" : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="text-right">
                  <button className="text-xs text-[#0D7A8A] hover:underline">Forgot password?</button>
                </div>
              )}

              <Btn variant="primary" size="lg" className="w-full justify-center" onClick={handleSubmit}>
                {isLogin ? "Sign In" : "Create Account"}
              </Btn>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => onNavigate(isLogin ? "register" : "login")}
                className="text-[#0D7A8A] font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Good morning, Alex 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your health summary for May 24, 2026</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard title="Latest Risk Level" value="Moderate" subtitle="Score: 44/100" icon={Activity} color="#C8821A" />
        <StatCard title="Last Prediction" value="May 20" subtitle="4 days ago" icon={Calendar} color="#0D7A8A" />
        <StatCard title="Total Predictions" value="12" subtitle="Since Jan 2026" icon={ClipboardList} color="#6264A0" trend="3 this month" />
        <StatCard title="Health Score" value="68/100" subtitle="+4 from last month" icon={Heart} color="#2A9E6B" trend="Improving trend" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Gauge */}
        <div className="bg-white rounded-xl border border-border p-6 flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display)" }}>Current Risk Score</h3>
            <Btn variant="secondary" size="sm" onClick={() => onNavigate("prediction")}>View Details</Btn>
          </div>
          <RiskGauge score={44} level="low" />
          <p className="text-xs text-muted-foreground text-center">Based on your May 20 health data</p>
        </div>

        {/* Risk factors */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Top Risk Factors</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskFactorsData} layout="vertical" barSize={12}>
              <XAxis type="number" domain={[0, 45]} hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#68787A" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, "Impact"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
              <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                {riskFactorsData.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-border p-6 flex flex-col gap-3">
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display)" }}>Quick Recommendations</h3>
          {[
            { icon: Activity, text: "30 min daily walk reduces glucose by ~8%", color: "#2A9E6B" },
            { icon: Heart, text: "Mediterranean diet may lower your risk 18%", color: "#0D7A8A" },
            { icon: ClipboardList, text: "Schedule A1C test — due in 3 weeks", color: "#C8821A" },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${r.color}18` }}>
                <r.icon size={13} style={{ color: r.color }} />
              </div>
              <p className="text-xs text-foreground leading-relaxed">{r.text}</p>
            </div>
          ))}
          <Btn variant="secondary" size="sm" className="w-full justify-center mt-2" onClick={() => onNavigate("recommendations")}>
            All Recommendations
          </Btn>
        </div>
      </div>

      {/* Trend charts — split into two single-line charts to avoid recharts dual-axis key collision */}
      <div className="mt-4 md:mt-6 bg-white rounded-xl border border-border p-4 md:p-6">
        <h3 className="font-semibold text-foreground text-sm mb-5" style={{ fontFamily: "var(--font-display)" }}>6-Month Health Trend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0D7A8A] inline-block rounded" /> Glucose (mg/dL)
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={healthTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} domain={[110, 140]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
                <Line type="monotone" dataKey="glucose" stroke="#0D7A8A" strokeWidth={2.5} dot={{ r: 3, fill: "#0D7A8A", strokeWidth: 0 }} name="Glucose" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#C0453A] inline-block rounded" /> Risk Score (0–100)
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={healthTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} domain={[35, 65]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
                <Line type="monotone" dataKey="risk" stroke="#C0453A" strokeWidth={2.5} dot={{ r: 3, fill: "#C0453A", strokeWidth: 0 }} strokeDasharray="5 3" name="Risk Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function HealthInputPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [vals, setVals] = useState({
    age: "42", gender: "female", glucose: "", bp: "", skin: "", insulin: "", bmi: "", dpf: "", pregnancies: "",
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-8">
        <div>
          <SectionHeader title="Health Data Input" subtitle="Enter your clinical measurements to generate a diabetes risk prediction." />
        </div>
        <div className="flex gap-3">
          <Btn variant="outline" size="md">Save Draft</Btn>
          <Btn variant="primary" size="md" icon={Activity} onClick={() => onNavigate("prediction")}>Run Prediction</Btn>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-8 max-w-3xl">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E8F6F8] border border-[#A8D9E2] mb-6 text-sm text-[#0D7A8A]">
          <Info size={14} />
          All values should be from your most recent clinical tests. Use metric units where possible.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <InputField label="Age" placeholder="e.g. 42" tooltip="Your age in years" value={vals.age} onChange={v => setVals(p => ({ ...p, age: v }))} />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-foreground">Gender</label>
              <HelpCircle size={13} className="text-muted-foreground" />
            </div>
            <div className="relative">
              <select className="w-full px-3.5 py-2.5 bg-[#F3F2EF] border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] appearance-none">
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <InputField label="Glucose Level (mg/dL)" placeholder="e.g. 120" tooltip="Plasma glucose concentration at 2 hours in an oral glucose tolerance test" value={vals.glucose} onChange={v => setVals(p => ({ ...p, glucose: v }))} />
          <InputField label="Blood Pressure (mm Hg)" placeholder="e.g. 72" tooltip="Diastolic blood pressure measurement" value={vals.bp} onChange={v => setVals(p => ({ ...p, bp: v }))} />
          <InputField label="Skin Thickness (mm)" placeholder="e.g. 23" tooltip="Triceps skin fold thickness" value={vals.skin} onChange={v => setVals(p => ({ ...p, skin: v }))} />
          <InputField label="Insulin Level (µU/mL)" placeholder="e.g. 85" tooltip="2-hour serum insulin level" value={vals.insulin} onChange={v => setVals(p => ({ ...p, insulin: v }))} />
          <InputField label="BMI (kg/m²)" placeholder="e.g. 28.1" tooltip="Body mass index = weight(kg) / height(m)²" value={vals.bmi} onChange={v => setVals(p => ({ ...p, bmi: v }))} />
          <InputField label="Diabetes Pedigree Function" placeholder="e.g. 0.627" tooltip="A function that scores likelihood of diabetes based on family history" value={vals.dpf} onChange={v => setVals(p => ({ ...p, dpf: v }))} />
          <InputField label="Number of Pregnancies" placeholder="e.g. 2" tooltip="Number of times pregnant (enter 0 if not applicable)" value={vals.pregnancies} onChange={v => setVals(p => ({ ...p, pregnancies: v }))} />
        </div>

        <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Data is processed locally. Not stored without your consent.</p>
          <div className="flex gap-3">
            <Btn variant="outline">Save Draft</Btn>
            <Btn variant="primary" icon={Activity} onClick={() => onNavigate("prediction")}>Run Prediction</Btn>
          </div>
        </div>
      </div>
    </>
  );
}

function PredictionPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <>
      <SectionHeader title="Prediction Result" subtitle="Based on your health data submitted May 20, 2026" />

      {/* Banner */}
      <div className="rounded-xl p-6 mb-6 flex items-center gap-4" style={{ backgroundColor: RISK_CONFIG.moderate.bg, border: `1.5px solid ${RISK_CONFIG.moderate.border}` }}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${RISK_CONFIG.moderate.color}22` }}>
          <AlertCircle size={28} style={{ color: RISK_CONFIG.moderate.color }} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ color: RISK_CONFIG.moderate.text, fontFamily: "var(--font-display)" }}>Moderate Diabetes Risk Detected</h2>
          <p className="text-sm mt-1" style={{ color: RISK_CONFIG.moderate.text }}>
            Your risk score is 62/100. Several biomarkers are elevated. Lifestyle changes and medical consultation are recommended.
          </p>
        </div>
        <RiskBadge level="moderate" size="lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Gauge */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 flex flex-col items-center gap-4 md:col-span-1">
          <h3 className="font-semibold text-foreground text-sm self-start" style={{ fontFamily: "var(--font-display)" }}>Risk Score</h3>
          <RiskGauge score={62} level="moderate" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ensemble confidence: <span className="font-semibold text-foreground font-mono">94.2%</span></p>
          </div>
        </div>

        {/* Factors */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 md:col-span-2">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Top Contributing Factors</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskFactorsData} layout="vertical" barSize={14}>
              <XAxis type="number" domain={[0, 45]} tick={{ fontSize: 11, fill: "#8D9EA0" }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#68787A" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, "Contribution"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
              <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                {riskFactorsData.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>What this means for you</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your glucose level of <strong className="text-foreground">131 mg/dL</strong> is the primary driver of your elevated risk — this is above the normal fasting range of 70–99 mg/dL and enters the pre-diabetic zone. Your BMI of <strong className="text-foreground">28.1</strong> is classified as overweight and compounds this risk. The good news: both factors are modifiable through diet, exercise, and medical management. With the right changes, risk reduction of 20–30% within 6 months is achievable.
        </p>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        {[
          { icon: Activity, title: "Increase physical activity", desc: "150 min/week moderate aerobic exercise. Start with 30-min walks.", color: "#2A9E6B", urgency: "High priority" },
          { icon: Heart, title: "Dietary changes", desc: "Reduce refined carbohydrates. Follow Mediterranean-style eating.", color: "#0D7A8A", urgency: "High priority" },
          { icon: Stethoscope, title: "Medical consultation", desc: "Schedule HbA1c test and consult your GP within 30 days.", color: "#C8821A", urgency: "Urgent" },
        ].map(r => (
          <div key={r.title} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${r.color}18` }}>
                <r.icon size={15} style={{ color: r.color }} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.color}18`, color: r.color }}>{r.urgency}</span>
            </div>
            <h4 className="font-semibold text-sm text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>{r.title}</h4>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <Btn variant="primary" icon={Download}>Download Report</Btn>
        <Btn variant="secondary" icon={RefreshCw} onClick={() => onNavigate("health-input")}>Run Again</Btn>
        <Btn variant="outline" onClick={() => onNavigate("patient")}>View Dashboard</Btn>
      </div>
    </>
  );
}

function TrackingPage() {
  const [dateRange, setDateRange] = useState("6m");
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-8">
        <SectionHeader title="Health Tracking" subtitle="Monitor your risk trend and historical health records." />
        <div className="flex gap-1.5 bg-muted rounded-lg p-1">
          {["1m", "3m", "6m", "1y"].map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                dateRange === r ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Risk Level Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={healthTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#8D9EA0" }} axisLine={false} tickLine={false} domain={[30, 70]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
            <Line type="monotone" dataKey="risk" stroke="#0D7A8A" strokeWidth={2.5} dot={{ r: 5, fill: "#0D7A8A", strokeWidth: 2, stroke: "#fff" }} name="Risk Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground text-sm mb-5" style={{ fontFamily: "var(--font-display)" }}>Health Record Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="flex flex-col gap-4">
            {trackingHistory.map((r, i) => (
              <div key={i} className="flex gap-5 relative">
                <div className="w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center flex-shrink-0 z-10" style={{ borderColor: RISK_CONFIG[r.risk].color }}>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_CONFIG[r.risk].color }} />
                </div>
                <div className="flex-1 bg-muted rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-mono)" }}>{r.date}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span>Glucose: <strong className="text-foreground">{r.glucose} mg/dL</strong></span>
                      <span>BMI: <strong className="text-foreground">{r.bmi}</strong></span>
                      <span>BP: <strong className="text-foreground">{r.bp}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: RISK_CONFIG[r.risk].color }}>{r.score}/100</span>
                    <RiskBadge level={r.risk} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function RecommendationsPage() {
  const recs = [
    { cat: "Exercise", icon: Activity, color: "#2A9E6B", title: "Aerobic Exercise Program", desc: "150 minutes of moderate-intensity aerobic activity per week. Brisk walking, cycling, or swimming all qualify. Break it into 30-min daily sessions for easier adherence.", impact: "↓ 18% risk" },
    { cat: "Diet", icon: Heart, color: "#0D7A8A", title: "Mediterranean Dietary Pattern", desc: "High in vegetables, whole grains, olive oil, and lean protein. Limit processed carbohydrates and added sugars. Aim for a glycemic index below 55 for main meals.", impact: "↓ 22% risk" },
    { cat: "Monitoring", icon: Stethoscope, color: "#C8821A", title: "Schedule HbA1c Test", desc: "An HbA1c test gives a 3-month picture of average blood sugar. If above 5.7%, you are in the pre-diabetic range and immediate intervention is warranted.", impact: "Diagnostic" },
    { cat: "Weight", icon: TrendingUp, color: "#6264A0", title: "5–7% Body Weight Reduction", desc: "Losing just 5–7% of body weight (about 4–5 kg for you) can reduce diabetes risk by up to 58% in high-risk individuals, according to the DPP study.", impact: "↓ 58% risk" },
    { cat: "Sleep", icon: Clock, color: "#2A9E6B", title: "Optimize Sleep Quality", desc: "Poor sleep is associated with insulin resistance. Target 7–9 hours per night. Establish a consistent bedtime and reduce blue-light exposure after 9 PM.", impact: "↓ 9% risk" },
    { cat: "Stress", icon: Brain, color: "#C0453A", title: "Stress Management", desc: "Chronic stress elevates cortisol, which raises blood glucose. Mindfulness-based stress reduction (MBSR) programs have shown significant HbA1c improvements.", impact: "↓ 7% risk" },
  ];
  return (
    <>
      <SectionHeader title="Personalized Recommendations" subtitle="Evidence-based actions tailored to your current risk profile and biomarkers." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
        {recs.map(r => (
          <div key={r.title} className="bg-white rounded-xl border border-border p-5 flex gap-4 hover:border-[#A8D9E2] hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${r.color}18` }}>
              <r.icon size={18} style={{ color: r.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: r.color }}>{r.cat}</span>
                <span className="text-xs font-bold" style={{ color: r.color }}>{r.impact}</span>
              </div>
              <h4 className="font-semibold text-foreground mt-2 mb-1" style={{ fontFamily: "var(--font-display)" }}>{r.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ProviderDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Provider Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Dr. Sarah Chen — Internal Medicine · May 24, 2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard title="Total Patients" value="124" subtitle="Active panel" icon={Users} color="#0D7A8A" trend="6 new this month" />
        <StatCard title="High Risk Patients" value="26" subtitle="Require follow-up" icon={AlertCircle} color="#C0453A" />
        <StatCard title="Predictions Today" value="18" subtitle="Across all patients" icon={Activity} color="#2A9E6B" />
        <StatCard title="Pending Feedback" value="7" subtitle="Awaiting clinical notes" icon={ClipboardList} color="#C8821A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Risk distribution */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Patient Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={riskDistData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {riskDistData.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} patients`]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {riskDistData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />{d.name}
                </span>
                <span className="font-semibold text-foreground font-mono">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical insights */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 md:col-span-2">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Recent Clinical Insights</h3>
          <div className="flex flex-col gap-3">
            {[
              { text: "Glucose levels rising in 5 patients over 45 this month", level: "high" as RiskLevel, time: "2h ago" },
              { text: "3 patients' risk dropped >10% following intervention notes", level: "low" as RiskLevel, time: "Yesterday" },
              { text: "BMI trend: 8 patients with increasing BMI over 3 months", level: "moderate" as RiskLevel, time: "2 days ago" },
            ].map((ins, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <RiskBadge level={ins.level} />
                <p className="text-sm text-foreground flex-1">{ins.text}</p>
                <span className="text-xs text-muted-foreground flex-shrink-0">{ins.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-6 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display)" }}>Patient List</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] w-56" placeholder="Search patients..." />
            </div>
            <Btn variant="outline" size="sm" icon={Download}>Export</Btn>
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Patient ID", "Name", "Age", "Last Check", "Glucose", "BMI", "Risk Level", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providerPatients.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{p.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{p.age}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{p.lastCheck}</td>
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{p.glucose}</td>
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{p.bmi}</td>
                  <td className="px-6 py-4"><RiskBadge level={p.risk} /></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Btn variant="secondary" size="sm" onClick={() => onNavigate("clinical")}>View</Btn>
                      <Btn variant="ghost" size="sm">Notes</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing 5 of 124 patients</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(n => (
              <button key={n} className={cn("w-8 h-8 rounded-lg text-xs font-medium transition-colors", n === 1 ? "bg-[#0D7A8A] text-white" : "hover:bg-muted text-muted-foreground")}>{n}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ClinicalInsightsPage() {
  return (
    <>
      <SectionHeader title="Clinical Insights" subtitle="Detailed ML analysis for patient P-1031 · Fatima Al-Rashid" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Patient Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Name", "Fatima Al-Rashid"], ["Age", "62 years"], ["Gender", "Female"],
                ["Patient ID", "P-1031"], ["Last Visit", "May 18, 2026"], ["Primary Care", "Dr. Chen"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="font-semibold text-foreground mt-0.5" style={{ fontFamily: k === "Patient ID" ? "var(--font-mono)" : undefined }}>{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Prediction Result</span>
                <RiskBadge level="high" size="md" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <span className="text-xl font-bold text-[#C0453A]" style={{ fontFamily: "var(--font-mono)" }}>78/100</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Risk Factor Analysis</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={riskFactorsData} layout="vertical" barSize={10}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: "#68787A" }} axisLine={false} tickLine={false} />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {riskFactorsData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-3" style={{ fontFamily: "var(--font-display)" }}>Historical Trend</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={healthTrendData}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[35, 80]} />
                <Line type="monotone" dataKey="risk" stroke="#C0453A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-[#0D7A8A]" />
              <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display)" }}>ML Insight Summary</h3>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-4 flex gap-2">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              For clinical decision support only. This AI analysis is not a substitute for professional medical diagnosis.
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The ensemble model assigns a <strong className="text-foreground">High Risk</strong> classification with 78/100 score. Primary driver: fasting glucose of <strong className="text-foreground">158 mg/dL</strong>, which is above the diabetic threshold (≥126 mg/dL). Secondary drivers include BMI 33.1 (obese class I) and age 62 (elevated baseline risk). The Neural Network and SVM models agree: both independently score above 75.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { model: "Neural Net", score: 79, agree: true },
                { model: "SVM", score: 76, agree: true },
                { model: "Decision Tree", score: 81, agree: true },
                { model: "Logistic Reg.", score: 74, agree: true },
              ].map(m => (
                <div key={m.model} className="flex items-center justify-between p-2.5 rounded-lg bg-muted text-xs">
                  <span className="text-muted-foreground">{m.model}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground font-mono">{m.score}/100</span>
                    <CheckCircle size={11} className="text-[#C0453A]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-3" style={{ fontFamily: "var(--font-display)" }}>Clinical Actions</h3>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                <p className="text-xs font-semibold text-red-800 mb-1">Recommended Immediate Actions</p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Order HbA1c test — fasting glucose above diabetic threshold</li>
                  <li>Refer to endocrinology for evaluation</li>
                  <li>Discuss diabetes medication initiation</li>
                </ul>
              </div>
              <div className="flex gap-3 mt-2">
                <Btn variant="primary" icon={Download} size="md">Download Report</Btn>
                <Btn variant="secondary" icon={ClipboardList} size="md">Submit Feedback</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const systemHealth = [
    { label: "CPU Usage", value: 34, color: "#2A9E6B" },
    { label: "Memory", value: 61, color: "#C8821A" },
    { label: "Avg Response", value: 28, unit: "ms", color: "#0D7A8A" },
    { label: "Disk Usage", value: 47, color: "#6264A0" },
  ];

  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Administrator Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview · May 24, 2026 · All systems operational</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard title="Total Users" value="1,247" subtitle="Patients, providers & admins" icon={Users} color="#0D7A8A" trend="48 new this month" />
        <StatCard title="Active Models" value="4" subtitle="All models deployed" icon={Brain} color="#6264A0" />
        <StatCard title="Datasets Loaded" value="3" subtitle="Pima + 2 clinical sets" icon={Database} color="#2A9E6B" />
        <StatCard title="System Uptime" value="99.97%" subtitle="Last 30 days" icon={Server} color="#2A9E6B" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* System health */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-5" style={{ fontFamily: "var(--font-display)" }}>System Health</h3>
          <div className="flex flex-col gap-4">
            {systemHealth.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-xs font-mono font-semibold text-foreground">{s.value}{s.unit || "%"}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Import Dataset", icon: Upload, color: "#0D7A8A", action: "training" as Page },
              { label: "Train Models", icon: Brain, color: "#6264A0", action: "training" as Page },
              { label: "Generate Report", icon: FileText, color: "#2A9E6B", action: "reports-admin" as Page },
              { label: "Evaluate Models", icon: BarChart2, color: "#C8821A", action: "evaluation" as Page },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.action)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-[#A8D9E2] hover:shadow-sm transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${a.color}18` }}>
                  <a.icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Model overview */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Model Performance Overview</h3>
          <div className="flex flex-col gap-3">
            {modelMetrics.map(m => (
              <div key={m.model} className={cn("flex items-center justify-between p-3 rounded-lg", m.status === "best" ? "bg-[#E8F6F8] border border-[#A8D9E2]" : "bg-muted")}>
                <div className="flex items-center gap-2">
                  {m.status === "best" && <Star size={12} className="text-[#0D7A8A]" />}
                  <span className="text-xs font-semibold text-foreground">{m.model}</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: m.status === "best" ? "#0D7A8A" : "#3A4E50" }}>{m.accuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full model table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display)" }}>Deployed Model Metrics</h3>
          <Btn variant="outline" size="sm" icon={RefreshCw}>Refresh</Btn>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Model", "Accuracy", "Precision", "Recall", "F1-Score", "Status"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modelMetrics.map((m, i) => (
              <tr key={i} className={cn("border-b border-border last:border-0", m.status === "best" && "bg-[#E8F6F8]/40")}>
                <td className="px-6 py-4 text-sm font-semibold text-foreground flex items-center gap-2">
                  {m.status === "best" && <Star size={13} className="text-[#0D7A8A]" />}
                  {m.model}
                </td>
                {[m.accuracy, m.precision, m.recall, m.f1].map((v, j) => (
                  <td key={j} className="px-6 py-4 text-sm font-mono font-semibold" style={{ color: m.status === "best" ? "#0D7A8A" : "#3A4E50" }}>{v}%</td>
                ))}
                <td className="px-6 py-4">
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", m.status === "best" ? "bg-[#E8F6F8] text-[#0D7A8A]" : "bg-muted text-muted-foreground")}>
                    {m.status === "best" ? "✓ Best" : "Deployed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ModelTrainingPage() {
  const [selected, setSelected] = useState<string[]>(["neural", "svm", "dt", "lr"]);
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const models = [
    { id: "neural", label: "Neural Network", icon: Brain, desc: "Multi-layer perceptron with 3 hidden layers" },
    { id: "svm", label: "Support Vector Machine", icon: GitBranch, desc: "RBF kernel with grid-search hypertuning" },
    { id: "dt", label: "Decision Tree", icon: Layers, desc: "CART algorithm with max depth = 8" },
    { id: "lr", label: "Logistic Regression", icon: TrendingUp, desc: "L2 regularization, liblinear solver" },
  ];

  const startTraining = () => {
    setTraining(true);
    const prog: Record<string, number> = {};
    selected.forEach(m => prog[m] = 0);
    setProgress(prog);
    let tick = 0;
    const iv = setInterval(() => {
      tick += 5;
      setProgress(p => {
        const next = { ...p };
        selected.forEach(m => {
          const jitter = Math.random() * 8;
          next[m] = Math.min(100, (next[m] || 0) + jitter);
        });
        return next;
      });
      if (tick >= 120) clearInterval(iv);
    }, 150);
  };

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  return (
    <>
      <SectionHeader title="Model Training" subtitle="Select models and initiate training on the current dataset." />

      {/* Dataset status */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E8F6F8] flex items-center justify-center">
          <Database size={18} className="text-[#0D7A8A]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Active Dataset: Pima Indians Diabetes Database</p>
          <p className="text-xs text-muted-foreground mt-0.5">768 records · 9 features · 34.9% positive rate · Last imported May 20, 2026</p>
        </div>
        <Btn variant="outline" size="sm" icon={Upload}>Import New Dataset</Btn>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        {models.map(m => {
          const isSelected = selected.includes(m.id);
          const prog = progress[m.id];
          return (
            <div
              key={m.id}
              onClick={() => !training && toggle(m.id)}
              className={cn(
                "bg-white rounded-xl border p-5 transition-all cursor-pointer",
                isSelected ? "border-[#0D7A8A] shadow-sm shadow-[#0D7A8A]/10" : "border-border hover:border-gray-300",
                training && "cursor-default"
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isSelected ? "bg-[#E8F6F8]" : "bg-muted")}>
                  <m.icon size={16} className={isSelected ? "text-[#0D7A8A]" : "text-muted-foreground"} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-all", isSelected ? "bg-[#0D7A8A] border-[#0D7A8A]" : "border-gray-300")}>
                      {isSelected && <CheckCircle size={10} className="text-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </div>
              {training && isSelected && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">{prog >= 100 ? "Complete" : "Training..."}</span>
                    <span className="text-xs font-mono font-semibold text-[#0D7A8A]">{Math.round(prog || 0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-[#0D7A8A] rounded-full transition-all duration-300" style={{ width: `${prog || 0}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Btn variant="primary" size="lg" icon={Play} onClick={startTraining}>
          Train {selected.length} Model{selected.length !== 1 ? "s" : ""}
        </Btn>
        <p className="text-sm text-muted-foreground">{selected.length} of {models.length} models selected</p>
      </div>

      {training && Object.values(progress).some(v => v >= 100) && (
        <div className="mt-6 p-4 rounded-xl bg-[#EEF9F4] border border-green-200">
          <div className="flex items-center gap-2 text-[#1A6042] font-semibold text-sm">
            <CheckCircle size={16} />
            Training complete! Navigate to Model Evaluation to compare results.
          </div>
        </div>
      )}
    </>
  );
}

function ModelEvaluationPage() {
  const confusionData = [
    { label: "TP", value: 142, color: "#2A9E6B" },
    { label: "FP", value: 12, color: "#EDAEAA" },
    { label: "FN", value: 18, color: "#EDAEAA" },
    { label: "TN", value: 212, color: "#A8E2C8" },
  ];

  return (
    <>
      <SectionHeader title="Model Evaluation" subtitle="Compare performance metrics across all trained models." />

      {/* Metrics table */}
      <div className="bg-white rounded-xl border border-border mb-6">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display)" }}>Performance Comparison</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Model", "Accuracy", "Precision", "Recall", "F1-Score"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modelMetrics.map((m, i) => (
              <tr key={i} className={cn("border-b border-border last:border-0", m.status === "best" && "bg-[#E8F6F8]/50")}>
                <td className="px-6 py-4 text-sm font-semibold text-foreground flex items-center gap-1.5">
                  {m.status === "best" && <Star size={13} className="text-[#0D7A8A]" />}
                  {m.model}
                </td>
                {[m.accuracy, m.precision, m.recall, m.f1].map((v, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold" style={{ color: m.status === "best" ? "#0D7A8A" : "#3A4E50" }}>{v}%</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full max-w-16">
                        <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: m.status === "best" ? "#0D7A8A" : "#8D9EA0" }} />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confusion matrices + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Confusion matrix - NN */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-1" style={{ fontFamily: "var(--font-display)" }}>Confusion Matrix — Neural Network</h3>
          <p className="text-xs text-muted-foreground mb-4">Test set: 384 samples</p>
          <div className="grid grid-cols-2 gap-2 max-w-36 sm:max-w-48 mx-auto">
            {confusionData.map(c => (
              <div key={c.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: `${c.color}22` }}>
                <p className="text-2xl font-bold" style={{ color: c.color, fontFamily: "var(--font-mono)" }}>{c.value}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: c.color }}>{c.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1 text-center text-xs text-muted-foreground">
            <span>Predicted Positive</span>
            <span>Predicted Negative</span>
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Multi-Metric Radar Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={[
              { metric: "Accuracy", NN: 94.2, SVM: 91.7, DT: 87.3, LR: 89.1 },
              { metric: "Precision", NN: 93.8, SVM: 90.2, DT: 86.1, LR: 88.7 },
              { metric: "Recall", NN: 91.4, SVM: 89.6, DT: 88.4, LR: 87.9 },
              { metric: "F1", NN: 92.6, SVM: 89.9, DT: 87.2, LR: 88.3 },
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <Radar dataKey="NN" stroke="#0D7A8A" fill="#0D7A8A" fillOpacity={0.15} name="Neural Net" />
              <Radar dataKey="SVM" stroke="#2A9E6B" fill="#2A9E6B" fillOpacity={0.1} name="SVM" />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best model recommendation */}
      <div className="bg-[#E8F6F8] rounded-xl border border-[#A8D9E2] p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#0D7A8A] flex items-center justify-center flex-shrink-0">
          <Star size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-[#0A5F6C]" style={{ fontFamily: "var(--font-display)" }}>Recommended: Neural Network</h3>
          <p className="text-sm text-[#2A93A8] mt-0.5">Highest accuracy (94.2%) and F1-score (92.6%) across all 4 metrics. Suitable for clinical deployment.</p>
        </div>
        <Btn variant="primary">Deploy Model</Btn>
      </div>
    </>
  );
}

function ReportsPage({ role }: { role: Role }) {
  const [reportType, setReportType] = useState("individual");
  const recentReports = [
    { name: "Individual Risk Report — Alex Johnson", date: "May 20, 2026", type: "PDF", size: "248 KB" },
    { name: "Monthly Patient Summary", date: "May 01, 2026", type: "PDF", size: "1.2 MB" },
    { name: "Model Performance Report Q2", date: "Apr 30, 2026", type: "CSV", size: "82 KB" },
    { name: "Clinical Panel Review — May", date: "Apr 25, 2026", type: "PDF", size: "460 KB" },
  ];

  return (
    <>
      <SectionHeader title="Report Generation" subtitle="Generate, preview, and download clinical and administrative reports." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-5">
          {/* Config */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Report Configuration</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Report Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(role === "admin"
                    ? ["Model Performance", "System Usage", "User Analytics", "Training Summary"]
                    : ["Individual Risk", "Monthly Summary", "Provider Panel", "Clinical Insights"]
                  ).map(t => (
                    <button
                      key={t}
                      onClick={() => setReportType(t)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                        reportType === t ? "bg-[#E8F6F8] text-[#0D7A8A] border-[#A8D9E2]" : "bg-white text-muted-foreground border-border hover:border-gray-300"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <InputField label="Start Date" type="date" />
                <InputField label="End Date" type="date" />
              </div>
              <div className="flex gap-3 pt-2">
                <Btn variant="primary" icon={FileText}>Generate Report</Btn>
                <Btn variant="outline" icon={Download}>Download PDF</Btn>
                <Btn variant="outline" icon={Download}>Download CSV</Btn>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Report Preview</h3>
            <div className="border-2 border-dashed border-border rounded-xl h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileText size={32} className="opacity-30" />
              <p className="text-sm">Select report type and date range, then click Generate Report</p>
            </div>
          </div>
        </div>

        {/* Recent reports */}
        <div className="bg-white rounded-xl border border-border p-6 h-fit">
          <h3 className="font-semibold text-foreground text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Recent Reports</h3>
          <div className="flex flex-col gap-2">
            {recentReports.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-[#E8F6F8] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={14} className="text-[#0D7A8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-snug">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.date} · {r.type} · {r.size}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={13} className="text-muted-foreground hover:text-[#0D7A8A]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Nutrition", "Exercise", "Medication", "Monitoring", "Mental Health", "Research"];
  const articles = [
    { cat: "Nutrition", title: "Understanding the Glycemic Index", preview: "How different foods affect your blood sugar levels and why the GI matters for diabetes prevention.", readTime: "6 min" },
    { cat: "Exercise", title: "Exercise as Medicine: Glucose Control", preview: "Evidence-based exercise protocols that can lower HbA1c by up to 1.5% over 12 weeks.", readTime: "8 min" },
    { cat: "Monitoring", title: "How to Read Your Fasting Glucose Results", preview: "A clear guide to interpreting your glucose numbers and knowing when to seek medical attention.", readTime: "4 min" },
    { cat: "Medication", title: "Metformin: What to Expect", preview: "The most commonly prescribed diabetes drug — mechanism, side effects, and what clinical trials show.", readTime: "10 min" },
    { cat: "Mental Health", title: "Diabetes Distress and How to Manage It", preview: "Living with diabetes risk affects mental health. Evidence-based strategies for managing diabetes-related anxiety.", readTime: "7 min" },
    { cat: "Research", title: "The Diabetes Prevention Program Study", preview: "Key findings from the landmark DPP trial: lifestyle changes outperformed Metformin in preventing Type 2.", readTime: "12 min" },
    { cat: "Nutrition", title: "Mediterranean Diet & Diabetes Risk", preview: "A meta-analysis of 15 trials shows Mediterranean eating reduces incident diabetes by 19–23%.", readTime: "9 min" },
    { cat: "Exercise", title: "Resistance Training for Insulin Sensitivity", preview: "Strength training improves insulin sensitivity independently of aerobic exercise. Here's the protocol.", readTime: "7 min" },
  ];
  const filtered = articles.filter(a =>
    (activeCategory === "All" || a.cat === activeCategory) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.preview.toLowerCase().includes(search.toLowerCase()))
  );
  const catColors: Record<string, string> = { Nutrition: "#2A9E6B", Exercise: "#0D7A8A", Medication: "#6264A0", Monitoring: "#C8821A", "Mental Health": "#C0453A", Research: "#3A4E50" };

  return (
    <>
      <SectionHeader title="Educational Resources" subtitle="Evidence-based articles curated for patients and providers." />
      <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
        {/* Sidebar filters */}
        <div className="w-full sm:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Categories</p>
            <div className="flex flex-col gap-1">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg text-sm transition-all",
                    activeCategory === c ? "bg-[#E8F6F8] text-[#0D7A8A] font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="flex-1">
          <div className="relative mb-5">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7A8A]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {filtered.map((a, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5 hover:border-[#A8D9E2] hover:shadow-sm transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: catColors[a.cat] || "#3A4E50" }}>
                    {a.cat}
                  </span>
                  <span className="text-xs text-muted-foreground">{a.readTime} read</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2 group-hover:text-[#0D7A8A] transition-colors" style={{ fontFamily: "var(--font-display)" }}>{a.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{a.preview}</p>
                <button className="text-xs font-semibold text-[#0D7A8A] hover:underline flex items-center gap-1">
                  Read More <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Settings Page ───────────────────────────────────────────────────────────

function SettingsPage({ role }: { role: Role }) {
  const userNames: Record<string, string> = { patient: "Alex Johnson", provider: "Dr. Sarah Chen", admin: "Dr. Admin" };
  const emails: Record<string, string> = { patient: "alex.johnson@email.com", provider: "sarah.chen@hospital.org", admin: "admin@diabetaai.com" };
  const key = role || "patient";

  const [profileName, setProfileName] = useState(userNames[key]);
  const [profileEmail, setProfileEmail] = useState(emails[key]);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [notifs, setNotifs] = useState({
    riskAlerts: true,
    weeklyDigest: true,
    predictionReady: true,
    providerMessages: role === "patient",
    newPatientAdded: role === "provider" || role === "admin",
    modelUpdates: role === "admin",
    systemAlerts: role === "admin",
    marketingEmails: false,
  });

  const saveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const savePassword = () => {
    setPwError("");
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  };

  const toggleNotif = (key: string) =>
    setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }));

  const roleLabel = role === "admin" ? "Administrator" : role === "provider" ? "Healthcare Provider" : "Patient";

  const notifGroups = [
    {
      label: "Clinical & Health",
      items: [
        { key: "riskAlerts", label: "Risk level alerts", desc: "Get notified when your risk score changes significantly." },
        { key: "predictionReady", label: "Prediction complete", desc: "Notify me when a new prediction result is ready." },
        { key: "weeklyDigest", label: "Weekly health digest", desc: "A weekly summary of your health trend and recommendations." },
      ].filter(i => role === "patient" || i.key === "predictionReady"),
    },
    {
      label: "Collaboration",
      items: [
        { key: "providerMessages", label: "Messages from providers", desc: "Receive a notification when your provider sends a note." },
        { key: "newPatientAdded", label: "New patient added", desc: "Alert when a new patient is assigned to your panel." },
      ].filter(i =>
        (i.key === "providerMessages" && role === "patient") ||
        (i.key === "newPatientAdded" && (role === "provider" || role === "admin"))
      ),
    },
    {
      label: "System",
      items: [
        { key: "modelUpdates", label: "Model updates", desc: "Notify when ML models are retrained or a new version is deployed." },
        { key: "systemAlerts", label: "System alerts", desc: "Critical infrastructure and uptime alerts." },
        { key: "marketingEmails", label: "Product updates & news", desc: "Occasional emails about new features and announcements." },
      ].filter(i =>
        (i.key === "marketingEmails") ||
        ((i.key === "modelUpdates" || i.key === "systemAlerts") && role === "admin")
      ),
    },
  ].filter(g => g.items.length > 0);

  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences — {roleLabel} account</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">

        {/* ── Profile ── */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0D7A8A18" }}>
              <Settings size={15} style={{ color: "#0D7A8A" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Profile Information</h2>
              <p className="text-xs text-muted-foreground">Update your display name and email address.</p>
            </div>
          </div>
          <div className="px-6 py-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0D7A8A, #0A5F6C)" }}>
                {profileName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{profileName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
                <button className="text-xs text-[#0D7A8A] font-medium hover:underline mt-1">Change avatar</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3F2EF] border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3F2EF] border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Btn variant="primary" onClick={saveProfile}>Save Profile</Btn>
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#2A9E6B", animation: "fade-in-up 0.3s ease both" }}>
                  <CheckCircle size={14} /> Saved successfully
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Password ── */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#6264A018" }}>
              <Shield size={15} style={{ color: "#6264A0" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Change Password</h2>
              <p className="text-xs text-muted-foreground">Use a strong password with at least 8 characters.</p>
            </div>
          </div>
          <div className="px-6 py-6 flex flex-col gap-4">
            {/* Current password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#F3F2EF] border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                >
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#F3F2EF] border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
              {/* Strength meter */}
              {newPw.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map(n => {
                    const score = Math.min(Math.floor(newPw.length / 3), 4);
                    const colors = ["#C0453A", "#C8821A", "#C8821A", "#2A9E6B"];
                    return (
                      <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: n <= score ? colors[score - 1] : "#ECEAE6" }} />
                    );
                  })}
                  <span className="text-xs text-muted-foreground ml-1">
                    {newPw.length < 3 ? "Weak" : newPw.length < 6 ? "Fair" : newPw.length < 9 ? "Good" : "Strong"}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className={cn(
                  "w-full px-3.5 py-2.5 bg-[#F3F2EF] border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                  confirmPw && confirmPw !== newPw
                    ? "border-[#C0453A] focus:ring-[#C0453A]"
                    : "border-border focus:ring-[#0D7A8A]"
                )}
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs font-medium" style={{ color: "#C0453A" }}>Passwords do not match</p>
              )}
            </div>

            {pwError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "#FBF0EF", color: "#C0453A", border: "1px solid #F0B8B4" }}>
                <span className="font-bold">!</span> {pwError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Btn variant="primary" onClick={savePassword}>Update Password</Btn>
              {pwSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#2A9E6B", animation: "fade-in-up 0.3s ease both" }}>
                  <CheckCircle size={14} /> Password updated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#C8821A18" }}>
              <Bell size={15} style={{ color: "#C8821A" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Notification Preferences</h2>
              <p className="text-xs text-muted-foreground">Choose which alerts and updates you receive.</p>
            </div>
          </div>
          <div className="px-6 py-2 divide-y divide-border">
            {notifGroups.map(group => (
              <div key={group.label} className="py-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{group.label}</p>
                <div className="flex flex-col gap-3">
                  {group.items.map(item => (
                    <div key={item.key} className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      {/* Toggle switch */}
                      <button
                        role="switch"
                        aria-checked={notifs[item.key as keyof typeof notifs]}
                        onClick={() => toggleNotif(item.key)}
                        className="relative flex-shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0D7A8A] focus:ring-offset-1"
                        style={{
                          backgroundColor: notifs[item.key as keyof typeof notifs] ? "#0D7A8A" : "#DDD9D4",
                        }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                          style={{ transform: notifs[item.key as keyof typeof notifs] ? "translateX(20px)" : "translateX(0)" }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-border bg-[#F3F2EF]">
            <p className="text-xs text-muted-foreground">
              Email notifications are sent to <strong className="text-foreground">{profileEmail}</strong>. Update your email above to change the destination.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState<AppState>({ page: "landing", role: null });

  const navigate = (page: Page) => setState(s => ({ ...s, page }));
  const setRole = (role: Role) => setState(s => ({ ...s, role }));
  const logout = () => setState({ page: "landing", role: null });

  const { page, role } = state;

  // Public pages
  if (page === "landing") return <LandingPage onNavigate={navigate} />;
  if (page === "login") return <AuthPage mode="login" onNavigate={navigate} setRole={setRole} />;
  if (page === "register") return <AuthPage mode="register" onNavigate={navigate} setRole={setRole} />;

  // Dashboard pages — all share the layout
  const content = (() => {
    switch (page) {
      case "patient": return <PatientDashboard onNavigate={navigate} />;
      case "health-input": return <HealthInputPage onNavigate={navigate} />;
      case "prediction": return <PredictionPage onNavigate={navigate} />;
      case "tracking": return <TrackingPage />;
      case "recommendations": return <RecommendationsPage />;
      case "resources": return <ResourcesPage />;
      case "reports-patient": return <ReportsPage role={role} />;
      case "provider": return <ProviderDashboard onNavigate={navigate} />;
      case "clinical": return <ClinicalInsightsPage />;
      case "admin": return <AdminDashboard onNavigate={navigate} />;
      case "training": return <ModelTrainingPage />;
      case "evaluation": return <ModelEvaluationPage />;
      case "reports-admin": return <ReportsPage role={role} />;
      case "settings": return <SettingsPage role={role} />;
      default: return <PatientDashboard onNavigate={navigate} />;
    }
  })();

  return (
    <DashboardLayout page={page} role={role} onNavigate={navigate} onLogout={logout}>
      {content}
    </DashboardLayout>
  );
}

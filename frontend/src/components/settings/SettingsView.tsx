"use client";

import { useState } from "react";
import { Bell, CheckCircle, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/user";

const PROFILE_DEFAULTS: Record<string, { name: string; email: string }> = {
  patient: { name: "Alex Johnson", email: "alex.johnson@email.com" },
  provider: { name: "Dr. Sarah Chen", email: "sarah.chen@hospital.org" },
  admin: { name: "Dr. Admin", email: "admin@diabetaai.com" },
};

const ROLE_LABEL: Record<string, string> = {
  patient: "Patient",
  provider: "Healthcare Provider",
  admin: "Administrator",
};

export function SettingsView({ role }: { role: Role }) {
  const key = role || "patient";
  const defaults = PROFILE_DEFAULTS[key];
  const roleLabel = ROLE_LABEL[key];

  const [profileName, setProfileName] = useState(defaults.name);
  const [profileEmail, setProfileEmail] = useState(defaults.email);
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
    window.setTimeout(() => setProfileSaved(false), 2500);
  };

  const savePassword = () => {
    setPwError("");
    if (!currentPw) {
      setPwError("Current password is required.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaved(true);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    window.setTimeout(() => setPwSaved(false), 2500);
  };

  const toggleNotif = (key: string) =>
    setNotifs((n) => ({ ...n, [key]: !n[key as keyof typeof n] }));

  const notifGroups = [
    {
      label: "Clinical & Health",
      items: [
        {
          key: "riskAlerts",
          label: "Risk level alerts",
          desc: "Get notified when your risk score changes significantly.",
        },
        {
          key: "predictionReady",
          label: "Prediction complete",
          desc: "Notify me when a new prediction result is ready.",
        },
        {
          key: "weeklyDigest",
          label: "Weekly health digest",
          desc: "A weekly summary of your health trend and recommendations.",
        },
      ].filter((i) => role === "patient" || i.key === "predictionReady"),
    },
    {
      label: "Collaboration",
      items: [
        {
          key: "providerMessages",
          label: "Messages from providers",
          desc: "Receive a notification when your provider sends a note.",
        },
        {
          key: "newPatientAdded",
          label: "New patient added",
          desc: "Alert when a new patient is assigned to your panel.",
        },
      ].filter(
        (i) =>
          (i.key === "providerMessages" && role === "patient") ||
          (i.key === "newPatientAdded" && (role === "provider" || role === "admin"))
      ),
    },
    {
      label: "System",
      items: [
        {
          key: "modelUpdates",
          label: "Model updates",
          desc: "Notify when ML models are retrained or a new version is deployed.",
        },
        {
          key: "systemAlerts",
          label: "System alerts",
          desc: "Critical infrastructure and uptime alerts.",
        },
        {
          key: "marketingEmails",
          label: "Product updates & news",
          desc: "Occasional emails about new features and announcements.",
        },
      ].filter(
        (i) =>
          i.key === "marketingEmails" ||
          ((i.key === "modelUpdates" || i.key === "systemAlerts") && role === "admin")
      ),
    },
  ].filter((g) => g.items.length > 0);

  const inputClass =
    "w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1
          className="text-xl md:text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences — {roleLabel} account
        </p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">
        {/* Profile */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
              <Settings size={15} className="text-primary" />
            </div>
            <div>
              <h2
                className="text-sm font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Profile Information
              </h2>
              <p className="text-xs text-muted-foreground">
                Update your display name and email address.
              </p>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0D7A8A, #0A5F6C)" }}
              >
                {profileName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{profileName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
                <button className="text-xs text-primary font-medium hover:underline mt-1">
                  Change avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={saveProfile}>
                Save Profile
              </Button>
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-[#2A9E6B] fade-in-up">
                  <CheckCircle size={14} /> Saved successfully
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6264A0]/10">
              <Shield size={15} className="text-[#6264A0]" />
            </div>
            <div>
              <h2
                className="text-sm font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Change Password
              </h2>
              <p className="text-xs text-muted-foreground">
                Use a strong password with at least 8 characters.
              </p>
            </div>
          </div>
          <div className="px-6 py-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className={cn(inputClass, "pr-16")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                >
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  className={cn(inputClass, "pr-16")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
              {newPw.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map((n) => {
                    const score = Math.min(Math.floor(newPw.length / 3), 4);
                    const colors = ["#C0453A", "#C8821A", "#C8821A", "#2A9E6B"];
                    return (
                      <div
                        key={n}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: n <= score ? colors[score - 1] : "#ECEAE6",
                        }}
                      />
                    );
                  })}
                  <span className="text-xs text-muted-foreground ml-1">
                    {newPw.length < 3 ? "Weak" : newPw.length < 6 ? "Fair" : newPw.length < 9 ? "Good" : "Strong"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className={cn(
                  inputClass,
                  confirmPw && confirmPw !== newPw
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-primary"
                )}
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs font-medium text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>

            {pwError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-destructive/5 text-destructive border border-destructive/20">
                <span className="font-bold">!</span> {pwError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button variant="primary" onClick={savePassword}>
                Update Password
              </Button>
              {pwSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-[#2A9E6B] fade-in-up">
                  <CheckCircle size={14} /> Password updated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#C8821A]/10">
              <Bell size={15} className="text-[#C8821A]" />
            </div>
            <div>
              <h2
                className="text-sm font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Notification Preferences
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose which alerts and updates you receive.
              </p>
            </div>
          </div>
          <div className="px-6 py-2 divide-y divide-border">
            {notifGroups.map((group) => (
              <div key={group.label} className="py-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.label}
                </p>
                <div className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={notifs[item.key as keyof typeof notifs]}
                        onClick={() => toggleNotif(item.key)}
                        className="relative flex-shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                        style={{
                          backgroundColor: notifs[item.key as keyof typeof notifs]
                            ? "#0D7A8A"
                            : "#DDD9D4",
                        }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                          style={{
                            transform: notifs[item.key as keyof typeof notifs]
                              ? "translateX(20px)"
                              : "translateX(0)",
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-border bg-background">
            <p className="text-xs text-muted-foreground">
              Email notifications are sent to{" "}
              <strong className="text-foreground">{profileEmail}</strong>. Update your email
              above to change the destination.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
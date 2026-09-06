"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/user";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "patient", label: "Patient" },
  { value: "provider", label: "Provider" },
  { value: "admin", label: "Admin" },
];

const ROLE_DESTINATIONS: Record<string, string> = {
  patient: "/patient",
  provider: "/provider",
  admin: "/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("patient");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await api.login({ email, password });
      login(token.access_token, selectedRole as Role);
      router.push(ROLE_DESTINATIONS[selectedRole] ?? "/patient");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to your DiabetaAI account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          name="email"
          required
          autoComplete="email"
        />
        <InputField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          name="password"
          required
          autoComplete="current-password"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Sign in as
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value!)}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-semibold border transition-all capitalize",
                  selectedRole === r.value
                    ? "bg-secondary text-primary border-[#A8D9E2]"
                    : "bg-white text-muted-foreground border-border hover:border-[#A8D9E2]"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
          <button type="button" className="text-xs text-primary hover:underline">
            Forgot password?
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-primary font-medium hover:underline">
          Sign up
        </a>
      </p>
    </AuthShell>
  );
}
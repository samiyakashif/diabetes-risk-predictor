"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/user";

const ROLE_DESTINATIONS: Record<string, string> = {
  patient: "/patient",
  provider: "/provider",
  admin: "/admin",
};

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
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
      await api.register({ full_name: fullName, email, password });
      // Auto-login after successful registration
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
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Start predicting your diabetes risk today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label="Full Name"
          placeholder="Alex Johnson"
          value={fullName}
          onChange={setFullName}
          name="full_name"
          required
          autoComplete="name"
        />
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
          autoComplete="new-password"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Role</label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="patient">Patient</option>
              <option value="provider">Healthcare Provider</option>
              <option value="admin">Administrator</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}
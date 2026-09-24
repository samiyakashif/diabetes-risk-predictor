"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_HOME } from "@/types/user";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await api.login({ email, password });
      const user = await login(token.access_token);
      if (!user) {
        setError("Could not load your profile. Please try again.");
        return;
      }
      router.push(ROLE_HOME[user.role]);
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
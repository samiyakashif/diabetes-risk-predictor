"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { api, ApiError } from "@/lib/api";

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "email" | "reset" | "done";

export function ForgotPasswordDialog({ open, onClose }: ForgotPasswordDialogProps) {
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const close = () => {
    setMode("email");
    setEmail("");
    setToken("");
    setPassword("");
    setConfirm("");
    setError(null);
    setNotice(null);
    setLoading(false);
    onClose();
  };

  const requestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      if (res.reset_token) {
        setToken(res.reset_token);
        setNotice(res.message);
        setMode("reset");
      } else {
        setNotice(res.message);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reach the server"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token.trim(), password);
      setMode("done");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={close}
    >
      <div
        className="bg-white rounded-xl border border-border w-full max-w-md p-6 shadow-lg fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              {mode === "done" ? (
                <CheckCircle2 size={18} className="text-primary" />
              ) : mode === "reset" ? (
                <KeyRound size={18} className="text-primary" />
              ) : (
                <Mail size={18} className="text-primary" />
              )}
            </div>
            <h3
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {mode === "done"
                ? "Password updated"
                : mode === "reset"
                  ? "Set a new password"
                  : "Reset your password"}
            </h3>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {mode === "done" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Your password has been reset. You can now sign in with your new
              password.
            </p>
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={close}
            >
              Back to sign in
            </Button>
          </div>
        ) : mode === "reset" ? (
          <form onSubmit={resetPassword} className="flex flex-col gap-4">
            {notice && (
              <p className="text-sm text-muted-foreground">{notice}</p>
            )}
            <InputField
              label="Reset token"
              value={token}
              onChange={setToken}
              placeholder="Paste your reset token"
              required
            />
            <InputField
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
            />
            <InputField
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter new password"
              required
              autoComplete="new-password"
            />
            {error && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button
              variant="primary"
              className="w-full justify-center"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        ) : (
          <form onSubmit={requestToken} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter your account email and we&apos;ll generate a reset token.
            </p>
            <InputField
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            {error && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-muted-foreground">{notice}</p>
            )}
            <Button
              variant="primary"
              className="w-full justify-center"
              disabled={loading}
            >
              {loading ? "Sending..." : "Get reset token"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

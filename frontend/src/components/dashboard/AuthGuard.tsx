"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_HOME } from "@/types/user";
import type { Role } from "@/types/user";

const ROLE_RANK: Record<Role, number> = {
  patient: 0,
  provider: 1,
  admin: 2,
};

export function AuthGuard({
  children,
  minRole,
}: {
  children: React.ReactNode;
  minRole?: Role;
}) {
  const router = useRouter();
  const { isAuthenticated, loading, role } = useAuth();

  const blocked =
    Boolean(role) && Boolean(minRole) && ROLE_RANK[role as Role] < ROLE_RANK[minRole as Role];

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (role && minRole && ROLE_RANK[role] < ROLE_RANK[minRole]) {
      router.replace(ROLE_HOME[role]);
    }
  }, [isAuthenticated, role, minRole, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  if (loading || (minRole && !role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return <>{children}</>;
}
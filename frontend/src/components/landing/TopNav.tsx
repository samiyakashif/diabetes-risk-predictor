"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TopNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border h-16 flex items-center px-6 gap-6">
      <Link href="/" className="flex items-center gap-2.5 flex-1">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Activity size={16} className="text-white" />
        </div>
        <span
          className="font-bold text-foreground text-lg"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DiabetaAI
        </span>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">
          Features
        </a>
        <a
          href="#how-it-works"
          className="hover:text-foreground transition-colors"
        >
          How It Works
        </a>
        <a href="#resources" className="hover:text-foreground transition-colors">
          Resources
        </a>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Log In
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="primary" size="sm">
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Sign Up</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}
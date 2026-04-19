"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/supabaseClient";
import { Zap, LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* ─── Background ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] bg-primary/15 blur-[160px] rounded-full text-primary-foreground" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md z-10 space-y-8">
        {/* ─── Logo ─── */}
        <div className="flex flex-col items-center space-y-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:bg-primary/30 transition-colors text-primary-foreground">
              <Zap className="w-6 h-6 text-primary" />
            </div>
          </Link>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome <span className="text-primary">Back</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to access your command center.
          </p>
        </div>

        {/* ─── Form ─── */}
        <Card className="backdrop-blur-2xl bg-card/60 border border-border/50 shadow-2xl overflow-hidden relative text-foreground">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <CardHeader className="pt-8 pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <LogIn className="w-5 h-5 text-primary" />
              Secure Login
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@venuesync.io"
                  className="bg-background/50 border-border placeholder:text-muted-foreground/80 h-12 px-4 focus:border-primary/50 transition-colors text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background/50 border-border placeholder:text-muted-foreground/80 h-12 px-4 pr-12 focus:border-primary/50 transition-colors text-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground0 hover:text-muted-foreground  transition-colors"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-13 bg-primary hover:bg-primary font-bold text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-lg shadow-primary/20 transition-all mt-2 text-primary-foreground"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-foreground0">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:text-primary font-semibold transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

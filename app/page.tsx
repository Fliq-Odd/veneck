"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ShieldCheck,
  Radio,
  Zap,
  Users,
  ArrowRight,
  ScanLine,
  Eye,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: ScanLine,
    title: "QR-Based Onboarding",
    desc: "Attendees scan a single QR at the gate. No app downloads, no friction.",
  },
  {
    icon: MapPin,
    title: "Real-Time GPS Tracking",
    desc: "Every connected user appears as a live dot on your command map.",
  },
  {
    icon: Eye,
    title: "Crowd Density Heatmap",
    desc: "Instantly identify chokepoints, empty zones, and high-risk areas.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-First Architecture",
    desc: "Auto-disconnect when users leave the perimeter. Zero post-event tracking.",
  },
  {
    icon: Radio,
    title: "SOS Panic Button",
    desc: "One-tap emergency alerts with exact coordinates sent to security.",
  },
  {
    icon: BarChart3,
    title: "Live Attendance Analytics",
    desc: "Real-time headcount, zone distribution, and movement patterns.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* ─── Background Glow ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-emerald-600/15 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-teal-600/10 blur-[150px] rounded-full" />
      </div>

      {/* ─── Nav ─── */}
      <nav className="relative z-20 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xl font-black tracking-tight">
            Venue<span className="text-emerald-500">Sync</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-muted-foreground dark:text-slate-300 hover:text-foreground dark:text-white hover:bg-white/5"
            >
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-semibold px-5 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
          <Radio className="w-3 h-3 animate-pulse" />
          Live Crowd Intelligence Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          See Every Inch of
          <br />
          Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Stadium
          </span>{" "}
          in Real Time
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
          Deploy a QR code at the outer gate. Instantly track 50,000+ attendees
          on a live map. Identify chokepoints, deploy guards, and manage
          emergencies — all from one dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all flex items-center gap-2 group"
            >
              Launch Command Center
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-white/5 hover:border-slate-500 rounded-xl transition-all"
            >
              Sign In to Dashboard
            </Button>
          </Link>
        </div>

        {/* Mini stats */}
        <div className="mt-16 flex items-center justify-center gap-8 md:gap-16 text-center">
          <div>
            <p className="text-3xl font-black text-foreground dark:text-white">50K+</p>
            <p className="text-xs text-foreground0 uppercase tracking-wider mt-1">
              Concurrent Users
            </p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-3xl font-black text-foreground dark:text-white">&lt;100ms</p>
            <p className="text-xs text-foreground0 uppercase tracking-wider mt-1">
              Socket Latency
            </p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-3xl font-black text-emerald-500">0</p>
            <p className="text-xs text-foreground0 uppercase tracking-wider mt-1">
              API Keys Needed
            </p>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-black text-center mb-4">
          Built for{" "}
          <span className="text-emerald-500">Massive Scale</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
          Every feature you need to manage crowds at stadiums, concerts, and
          mega-events.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl bg-card/50 border border-border hover:border-emerald-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <f.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Footer ─── */}
      <section className="relative z-10 border-t border-border py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold uppercase tracking-widest text-emerald-500">
              Ready to Deploy?
            </span>
          </div>
          <h2 className="text-3xl font-black mb-4">
            Start Tracking in Under 60 Seconds
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Create your free account, set up an event, and share the QR. It is
            that simple.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
            >
              Create Free Account
            </Button>
          </Link>
          <p className="text-[10px] text-muted-foreground/80 mt-6 uppercase tracking-widest font-mono">
            No credit card required • Free forever for hackathons
          </p>
        </div>
      </section>
    </div>
  );
}

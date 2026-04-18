"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVeNeckStore } from "@/lib/store";
import {
  Zap,
  Users,
  ShieldAlert,
  MonitorPlay,
  Radio,
  ArrowLeft,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  LocateFixed,
  MapPin,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const LeafletUI = dynamic(() => import("@/components/LeafletUI"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background text-foreground0">
      <div className="w-16 h-16 mb-4 rounded-full border-4 border-border border-t-emerald-500 animate-spin" />
      <p className="font-mono tracking-widest text-sm uppercase">
        Initializing Geospatial Engine...
      </p>
    </div>
  ),
});

export default function LiveEventMonitor() {
  const params = useParams();
  const eventId = params.eventId as string;

  const { activeUsers, updateUserLocation, removeUser, alerts, addAlert } =
    useVeNeckStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [copied, setCopied] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState("00:00:00");

  const [geofenceCenter, setGeofenceCenter] = useState<[number, number]>([18.9389, 72.8258]);
  const [geofenceRadiusKm, setGeofenceRadiusKm] = useState(0.5);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // ─── Fetch Event Details ───────────────────────
  useEffect(() => {
    (async () => {
      if (supabase) {
        const { data } = await supabase
          .from("events")
          .select("lat, lng, radius_km")
          .eq("id", eventId)
          .single();
        if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
          setGeofenceCenter([data.lat, data.lng]);
          setGeofenceRadiusKm(data.radius_km || 0.5);
        }
      }
      setLoadingConfig(false);
    })();
  }, [eventId]);

  // ─── Socket Connection ───────────────────────
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit("join-event", eventId);

    newSocket.on("location-updated", (data) => {
      updateUserLocation(data.userId, {
        userId: data.userId,
        lat: data.lat,
        lng: data.lng,
        name: data.name,
        seat: data.seat,
      });
    });

    newSocket.on("sos-alert", (data) => {
      addAlert({
        id: `sos_${Date.now()}`,
        userId: data.userId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
        eventId,
      });
    });

    newSocket.on("user-disconnected", (data) => {
      removeUser(data.userId);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [eventId]);

  // ─── Timer ───────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinUrl(`${window.location.origin}/join/${eventId}`);
    }
  }, [eventId]);

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userCount = Object.keys(activeUsers).length;

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden relative font-sans">
      {/* ─── Full Background Map ─── */}
      <div className="absolute inset-0 z-0">
        {!loadingConfig && (
          <LeafletUI 
            activeUsers={activeUsers} 
            geofenceCenter={geofenceCenter}
            geofenceRadiusKm={geofenceRadiusKm}
            userCount={userCount}
          />
        )}
      </div>

      {/* ─── Floating Overlays ─── */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 md:p-6 flex flex-col justify-between">
        {/* ─── Top Bar ─── */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: Header + QR */}
          <div className="w-[360px] space-y-4 pointer-events-auto">
            {/* Nav Header */}
            <div className="flex items-center gap-3 backdrop-blur-xl bg-background/70 p-3 rounded-2xl border border-border shadow-2xl">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground dark:text-white h-9 w-9 p-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                <MonitorPlay className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black tracking-tight text-foreground dark:text-white leading-tight truncate">
                  Live <span className="text-emerald-500">Monitor</span>
                </h1>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">
                  {eventId}
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold text-xs animate-pulse shrink-0">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            </div>

            {/* QR Card */}
            <Card className="backdrop-blur-xl bg-background/70 border-border/50 shadow-2xl overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shrink-0">
                  <QRCodeSVG value={joinUrl} size={80} />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Entry QR Code
                  </p>
                  <p className="text-[9px] text-emerald-400 font-mono truncate">
                    {joinUrl}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className="h-7 text-[10px] border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-white/5 gap-1"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Metrics */}
          <div className="w-[300px] space-y-3 pointer-events-auto">
            {/* Live Count */}
            <Card className="backdrop-blur-xl bg-background/80 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.08)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-400" />
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">
                    Active Connections
                  </p>
                  <p className="text-4xl font-black text-foreground dark:text-white">{userCount}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 relative">
                  <div className="absolute inset-0 rounded-full border border-emerald-500/50 animate-ping opacity-20" />
                  <Users className="w-7 h-7 text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            {/* Uptime */}
            <Card className="backdrop-blur-xl bg-background/70 border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-foreground0" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Session Time
                  </span>
                </div>
                <span className="text-sm font-mono text-emerald-400 font-bold">
                  {elapsed}
                </span>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="backdrop-blur-xl bg-background/70 border-border/50">
              <CardHeader className="p-3 border-b border-border">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  System Alerts
                  {alerts.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] ml-auto">
                      {alerts.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[250px] overflow-y-auto p-3 space-y-2">
                  {alerts.length === 0 ? (
                    <p className="text-[10px] text-center text-muted-foreground/80 py-6 font-mono">
                      No anomalies detected.
                    </p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span className="text-[10px] font-bold text-rose-400 uppercase">
                            SOS Alert
                          </span>
                          <span className="text-[9px] text-foreground0 ml-auto font-mono">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          ({alert.lat.toFixed(5)}, {alert.lng.toFixed(5)})
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Attendee Roster */}
            <Card className="backdrop-blur-xl bg-background/70 border-border/50 flex-1 overflow-hidden flex flex-col max-h-[300px]">
              <CardHeader className="p-3 border-b border-border">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <LocateFixed className="w-4 h-4 text-emerald-500" /> Live Roster
                  </span>
                  <span className="text-[10px] bg-background px-2 py-0.5 rounded-full border border-border">GPS Authorized</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="p-2 space-y-1">
                  {Object.values(activeUsers).length === 0 ? (
                    <p className="text-[10px] text-center text-muted-foreground py-6 font-mono">
                      Awaiting connection pulses...
                    </p>
                  ) : (
                    Object.values(activeUsers).map((u: any) => (
                      <div key={u.userId} className="flex flex-col p-2 hover:bg-white/5 rounded-md border border-transparent hover:border-border transition-colors">
                        <div className="flex items-center justify-between pointer-events-auto">
                          <span className="text-xs font-bold text-foreground dark:text-white truncate pr-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]" />
                            {u.userId.split('_')[1] ? `Attendee_${u.userId.split('_')[1]}` : u.userId}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-mono tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">ONLINE</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground font-mono">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{u.lat?.toFixed(5)}, {u.lng?.toFixed(5)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── Bottom Bar (optional future use) ─── */}
        <div className="flex justify-center pointer-events-none">
          <div className="backdrop-blur-md bg-background/50 border border-border rounded-full px-6 py-2">
            <p className="text-[10px] text-foreground0 font-mono tracking-widest uppercase">
              VeNeck • Real-Time Crowd Intelligence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

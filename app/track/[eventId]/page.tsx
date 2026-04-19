"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import * as turf from "@turf/turf";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  SignalHigh,
  WifiOff,
  MapPin,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
export default function TrackEvent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;
  const userId = searchParams.get("user");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<
    "connecting" | "connected" | "out-of-bounds" | "error"
  >("connecting");
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Dynamic Event Geography Data
  const [geofenceCenter, setGeofenceCenter] = useState<[number, number] | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId || !userId) {
      setStatus("error");
      return;
    }

    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit("join-event", eventId);

    const fetchEventData = async () => {
      if (!supabase) return false;
      const { data, error } = await supabase
        .from("events")
        .select("lat, lng, radius_km")
        .eq("id", eventId)
        .single();
      
      if (data && data.lat && data.lng && data.radius_km) {
        setGeofenceCenter([data.lng, data.lat]); // turf takes [lng, lat]
        setGeofenceRadius(data.radius_km);
        return { center: [data.lng, data.lat], radius: data.radius_km };
      }
      return false;
    };

    let watchId: number;

    const initializeSubsystem = async () => {
      const geoConfig = await fetchEventData();
      if (!geoConfig) {
         setStatus("error");
         return;
      }

      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            // Turf.js distance check for geofence
            const from = turf.point([longitude, latitude]);
            const to = turf.point(geoConfig.center);
            const distance = turf.distance(from, to, {
              units: "kilometers",
            });

            if (distance > (geoConfig.radius as number)) {
              setStatus("out-of-bounds");
              newSocket.disconnect(); // Privacy enforcement
              return;
            }

            setStatus("connected");
            setCoords({ lat: latitude, lng: longitude });

            // Emit location to the server
            newSocket.emit("update-location", {
              eventId,
              userId,
              lat: latitude,
              lng: longitude,
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            // Code 1: PERMISSION_DENIED, Code 2: POSITION_UNAVAILABLE, Code 3: TIMEOUT
            if (error.code === 1) {
              setStatus("error"); // Permission explicitly denied
            } else if (error.code === 3) {
              console.warn("GPS lock timeout. Browser is still trying organically...");
              // We don't set status to error on timeout immediately so it doesn't break the UI loader
            } else {
              setStatus("error");
            }
          },
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
      } else {
        setStatus("error");
      }
    };

    initializeSubsystem();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      newSocket.disconnect();
    };
  }, [eventId, userId]);

  // ─── SOS Handler ─────────────────────────────
  const handleSOS = useCallback(() => {
    if (!socket || !coords) return;
    socket.emit("sos-alert", {
      eventId,
      userId,
      lat: coords.lat,
      lng: coords.lng,
    });
    setSosSent(true);
    setShowSosDialog(false);
    setTimeout(() => setSosSent(false), 5000);
  }, [socket, coords, eventId, userId]);

  return (
    <div
      className={`min-h-[100dvh] transition-colors duration-1000 flex flex-col items-center p-4 relative overflow-hidden font-sans
      ${status === "connected" ? "bg-background" : ""}
      ${status === "out-of-bounds" ? "bg-rose-950" : ""}
      ${status === "error" || status === "connecting" ? "bg-background" : ""}
    `}
    >
      {/* ─── Radar Background (Connected) ─── */}
      {status === "connected" && (
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-[800px] h-[800px] border border-primary/20 rounded-full absolute" />
          <div className="w-[600px] h-[600px] border border-primary/30 rounded-full absolute shadow-lg shadow-primary/20" />
          <div className="w-[400px] h-[400px] border border-primary/40 rounded-full absolute" />
          <div className="w-[200px] h-[200px] border border-primary/60 rounded-full bg-primary/5 backdrop-blur-3xl absolute animate-pulse text-primary-foreground" />
        </div>
      )}

      {/* ─── Danger Background (Out of Bounds) ─── */}
      {status === "out-of-bounds" && (
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-20">
          <div className="absolute inset-0 bg-rose-500/20 mix-blend-overlay" />
          <div className="w-[400px] h-[400px] border-4 border-rose-500/50 rounded-full absolute animate-ping" />
        </div>
      )}

      {/* ─── Top HUD ─── */}
      <div className="z-10 w-full max-w-sm flex justify-between items-center backdrop-blur-xl bg-black/40 border border-border/50 rounded-2xl p-3 px-5 shadow-2xl mb-8 mt-2 text-foreground">
        <div className="flex items-center gap-2">
          <RadioTower className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold text-sm tracking-widest text-foreground uppercase">
            V-Sync
          </span>
        </div>
        {status === "connecting" && (
          <Badge
            variant="outline"
            className="text-yellow-400 border-yellow-400/50 bg-yellow-400/10 font-mono"
          >
            LINKING...
          </Badge>
        )}
        {status === "connected" && (
          <Badge className="bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 font-bold px-3 py-1 animate-pulse shadow-lg shadow-primary/20 text-primary-foreground">
            LIVE SECURE
          </Badge>
        )}
        {status === "out-of-bounds" && (
          <Badge
            variant="destructive"
            className="font-bold px-3 py-1 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
          >
            DISCONNECTED
          </Badge>
        )}
        {status === "error" && (
          <Badge variant="destructive" className="font-mono">
            NO SIGNAL
          </Badge>
        )}
      </div>

      {/* ─── Main Status Card ─── */}
      <Card
        className={`z-10 w-full max-w-sm backdrop-blur-2xl bg-card/60 border-t border-l border-border/50 shadow-2xl transition-all duration-500 overflow-hidden relative
        ${status === "out-of-bounds" ? "border-rose-500/50 bg-rose-950/60 shadow-[0_0_30px_rgba(244,63,94,0.15)]" : "border-border"}
      `}
      >
        <div
          className={`absolute top-0 left-0 w-full h-[2px] opacity-70
          ${status === "connected" ? "bg-gradient-to-r from-transparent via-primary to-transparent" : ""}
          ${status === "out-of-bounds" ? "bg-gradient-to-r from-transparent via-rose-500 to-transparent" : ""}
        `}
        />

        <CardContent className="pt-8 text-center space-y-6 pb-8">
          {/* ─── Connected State ─── */}
          {status === "connected" && (
            <div className="space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-70 text-primary-foreground" />
                <div className="absolute inset-2 bg-primary/20 rounded-full border border-primary/50 shadow-lg shadow-primary/20 flex items-center justify-center z-10 backdrop-blur-sm text-primary-foreground">
                  <SignalHigh className="text-primary w-8 h-8" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">
                  Tracking Active
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
                  Your location is securely linked with the command center.
                </p>
              </div>

              {coords && (
                <div className="inline-flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg font-mono text-xs text-primary shadow-inner text-foreground">
                  <MapPin className="w-3 h-3 text-foreground0" />
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </div>
              )}

              {sosSent && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-lg flex items-center gap-2 justify-center">
                  <ShieldCheck className="w-4 h-4" />
                  SOS sent! Security has been alerted.
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={() => setShowSosDialog(true)}
                  className="w-full h-14 rounded-xl font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-foreground flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Trigger SOS Alert
                </Button>
              </div>
            </div>
          )}

          {/* ─── Out of Bounds State ─── */}
          {status === "out-of-bounds" && (
            <div className="space-y-6">
              <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/30 relative">
                <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-md" />
                <WifiOff className="text-rose-500 w-10 h-10 relative z-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight">
                  Perimeter Breach
                </h2>
                <p className="text-sm text-rose-200/70 mt-2 max-w-[260px] mx-auto leading-relaxed">
                  You have exited the designated stadium zone. Tracking has been
                  severed for your privacy.
                </p>
              </div>
            </div>
          )}

          {/* ─── Loading / Error State ─── */}
          {(status === "error" || status === "connecting") && (
            <div className="space-y-6 py-4">
              <div className="w-16 h-16 border-4 border-border border-t-slate-500 rounded-full animate-spin mx-auto text-foreground" />
              <div>
                <h2 className="text-lg font-bold text-muted-foreground  uppercase">
                  {status === "error"
                    ? "GPS Unavailable"
                    : "Establishing Handshake"}
                </h2>
                <p className="text-xs text-foreground0 mt-2">
                  {status === "error"
                    ? "Please enable location permissions in your browser settings."
                    : "Awaiting GPS triangulations..."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── SOS Confirmation Modal ─── */}
      <Dialog open={showSosDialog} onOpenChange={setShowSosDialog}>
        <DialogContent className="bg-card border-rose-500/30 text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              Confirm Emergency
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will immediately alert all security personnel with your exact
              coordinates. Only use this in a real emergency.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-border text-muted-foreground text-foreground"
              onClick={() => setShowSosDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-foreground font-bold shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              onClick={handleSOS}
            >
              Send SOS Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Footer ─── */}
      <div className="absolute bottom-6 text-primary/40 font-mono text-[10px] tracking-widest text-center z-10">
        SYSTEM // VENECK
        <br />
        {userId || "AWAITING ID"}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase, getUser, signOut } from "@/lib/supabaseClient";
import { useVeNeckStore, VenueEvent, OrgProfile } from "@/lib/store";
import {
  Plus,
  Zap,
  Radio,
  Calendar,
  MapPin,
  Users,
  LogOut,
  Eye,
  Copy,
  Check,
  BarChart3,
  Clock,
  ArrowRight,
  Settings,
  Radius,
  Trash2,
} from "lucide-react";

const PRESET_STADIUMS = [
  { id: "modi", name: "Narendra Modi Stadium, Ahmedabad", lat: 23.0917, lng: 72.5976, radius: 1.0 },
  { id: "eden", name: "Eden Gardens, Kolkata", lat: 22.5646, lng: 88.3433, radius: 0.8 },
  { id: "wankhede", name: "Wankhede Stadium, Mumbai", lat: 18.9389, lng: 72.8258, radius: 0.5 },
  { id: "saltlake", name: "Salt Lake Stadium, Kolkata", lat: 22.5684, lng: 88.4090, radius: 1.0 },
  { id: "chinnaswamy", name: "M. Chinnaswamy Stadium, Bengaluru", lat: 12.9788, lng: 77.5996, radius: 0.6 }
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, profile, setProfile, events, setEvents, addEvent } = useVeNeckStore();

  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventVenue, setNewEventVenue] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<VenueEvent | null>(null);
  const [copied, setCopied] = useState(false);

  // ─── Geofence State ───
  const [venueMode, setVenueMode] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState("modi");
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [customRadius, setCustomRadius] = useState("");

  // ─── Auth check ─────────────────────────────
  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      if (supabase) {
        // Fetch profile (redirect to onboarding if missing)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", u.id)
          .single();
        if (!profileData) {
          router.push("/onboarding");
          return;
        }
        setProfile(profileData as OrgProfile);

        // Fetch events
        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("owner_id", u.id)
          .order("created_at", { ascending: false });
        if (data) setEvents(data as VenueEvent[]);
      }
      setLoading(false);
    })();
  }, []);

  // ─── Create Event ───────────────────────────
  const handleCreateEvent = async () => {
    setCreating(true);
    const eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

    let lat = 0, lng = 0, radiusKm = 1.0, finalVenue = "";
    if (venueMode === "preset") {
      const preset = PRESET_STADIUMS.find(s => s.id === selectedPreset)!;
      lat = preset.lat;
      lng = preset.lng;
      radiusKm = preset.radius;
      finalVenue = preset.name;
    } else {
      lat = parseFloat(customLat) || 0;
      lng = parseFloat(customLng) || 0;
      radiusKm = parseFloat(customRadius) || 1.0;
      finalVenue = newEventVenue || "Custom Sector";
    }

    const newEvent: VenueEvent = {
      id: eventId,
      name: newEventName,
      venue: finalVenue,
      lat: lat,
      lng: lng,
      radius_km: radiusKm,
      date: newEventDate || new Date().toISOString().slice(0, 10),
      status: "upcoming",
      attendee_count: 0,
      created_at: new Date().toISOString(),
      owner_id: user?.id || "",
    };

    if (supabase) {
      try {
        await supabase.from("events").insert([newEvent]);
      } catch (e) {
        console.warn("Supabase insert failed, continuing locally");
      }
    }

    addEvent(newEvent);
    setCreatedEvent(newEvent);
    setCreating(false);
    setNewEventName("");
    setNewEventVenue("");
    setNewEventDate("");
  };

  // ─── Delete Event ───────────────────────────
  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to completely delete this event? This action cannot be reversed.")) {
      setEvents(events.filter(event => event.id !== id));
      if (supabase) {
        await supabase.from("events").delete().eq("id", id);
      }
    }
  };

  // ─── Sign Out ───────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push("/login");
  };

  const joinUrl = (eventId: string) =>
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${eventId}`
      : "";

  const copyLink = (eventId: string) => {
    navigator.clipboard.writeText(joinUrl(eventId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "live":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "ended":
        return "bg-slate-500/20 text-muted-foreground border-slate-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-foreground0 font-mono text-sm uppercase tracking-widest">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Top Nav ─── */}
      <header className="border-b border-border backdrop-blur-md bg-background/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="Logo" className="h-9 w-9 rounded-lg object-cover border border-emerald-500/40" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            <span className="text-lg font-black tracking-tight hidden sm:inline">
              {profile?.org_name || (<>Venue<span className="text-emerald-500">Sync</span></>)}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user?.email}
            </span>
            <Link href="/dashboard/settings">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground dark:text-white hover:bg-white/5 h-9 w-9 p-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground dark:text-white hover:bg-white/5 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* ─── Welcome + Create ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">
              Command <span className="text-emerald-500">Center</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Deploy, monitor, and analyze your events.
            </p>
          </div>
          <Button
            onClick={() => {
              setCreatedEvent(null);
              setShowCreateDialog(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold px-6 h-12 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </Button>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground dark:text-white">{events.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Events
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground dark:text-white">
                  {events.filter((e) => e.status === "live").length}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Live Now
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground dark:text-white">
                  {events.reduce((sum, e) => sum + (e.attendee_count || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Attendees
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Events List ─── */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Your Events
          </h2>

          {events.length === 0 ? (
            <Card className="bg-card/30 border-dashed border-border text-center">
              <CardContent className="py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                  <MapPin className="w-8 h-8 text-muted-foreground/80" />
                </div>
                <h3 className="text-lg font-bold text-muted-foreground">
                  No Events Yet
                </h3>
                <p className="text-sm text-foreground0 max-w-sm mx-auto">
                  Create your first event to generate a QR code and start
                  tracking attendees in real time.
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold px-6 mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="bg-card/50 border-border hover:border-emerald-500/20 transition-all duration-300 group"
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-foreground dark:text-white truncate">
                          {event.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${statusColor(event.status)} text-[10px] uppercase tracking-wider font-bold`}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {event.venue}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{" "}
                          {event.attendee_count || 0} joined
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-white/5 gap-1"
                        onClick={() => copyLink(event.id)}
                      >
                        {copied ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}{" "}
                        QR Link
                      </Button>
                      <Link href={`/dashboard/event/${event.id}`}>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-semibold gap-1 group"
                        >
                          <Eye className="w-3 h-3" />
                          Monitor
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-9 px-3"
                        onClick={(e) => handleDeleteEvent(event.id, e)}
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Create Event Dialog ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-border/50 text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              {createdEvent ? "Event Created!" : "Deploy New Event"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {createdEvent
                ? "Share this QR code at the outer security gate."
                : "Configure the event details and generate a live QR code."}
            </DialogDescription>
          </DialogHeader>

          {createdEvent ? (
            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center p-8 bg-white rounded-xl">
                <QRCodeSVG value={joinUrl(createdEvent.id)} size={220} />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground text-center font-bold">
                  Attendee Entry Link
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex-1 justify-center py-2 font-mono text-[10px] truncate rounded-md"
                  >
                    {joinUrl(createdEvent.id)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(createdEvent.id)}
                    className="text-muted-foreground hover:text-foreground dark:text-white shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Close
                </Button>
                <Link
                  href={`/dashboard/event/${createdEvent.id}`}
                  className="flex-1"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold">
                    Open Live Monitor
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                  Event Name
                </Label>
                <Input
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g., IPL Final 2026"
                  className="bg-background/50 border-border text-foreground dark:text-white h-12 focus:border-emerald-500/50 placeholder:text-muted-foreground/80"
                  required
                />
              </div>

              {/* ─── Ground Selection (Preset vs Custom) ─── */}
              <div className="space-y-3 pt-2 pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVenueMode("preset")}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md border transition-all ${
                      venueMode === "preset"
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                        : "bg-background/20 border-border text-muted-foreground hover:bg-background/50"
                    }`}
                  >
                    Preset Ground
                  </button>
                  <button
                    type="button"
                    onClick={() => setVenueMode("custom")}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md border transition-all ${
                      venueMode === "custom"
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                        : "bg-background/20 border-border text-muted-foreground hover:bg-background/50"
                    }`}
                  >
                    Custom Zone
                  </button>
                </div>

                {venueMode === "preset" && (
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                      Select Stadium
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {PRESET_STADIUMS.map((stadium) => (
                        <button
                          key={stadium.id}
                          type="button"
                          onClick={() => setSelectedPreset(stadium.id)}
                          className={`flex justify-between items-center px-4 py-2 rounded-xl border text-sm text-left transition-all ${
                            selectedPreset === stadium.id
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                              : "bg-background/30 border-border text-muted-foreground hover:border-slate-500"
                          }`}
                        >
                          <span>{stadium.name}</span>
                          <span className="text-[10px] opacity-70 border bg-background/50 px-1.5 py-0.5 rounded">
                            {stadium.radius}km zone
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {venueMode === "custom" && (
                  <div className="space-y-4 bg-background/30 p-3 rounded-xl border border-border">
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                        Ground Name
                      </Label>
                      <Input
                        value={newEventVenue}
                        onChange={(e) => setNewEventVenue(e.target.value)}
                        placeholder="e.g., Tech Park Sector 5"
                        className="bg-background/50 border-border text-foreground dark:text-white h-10 focus:border-emerald-500/50 text-sm placeholder:text-muted-foreground/80"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-bold">Latitude</Label>
                        <Input
                          type="number"
                          value={customLat}
                          onChange={(e) => setCustomLat(e.target.value)}
                          placeholder="e.g. 18.9389"
                          className="bg-background/50 border-border text-foreground dark:text-white h-10 focus:border-emerald-500/50 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-bold">Longitude</Label>
                        <Input
                          type="number"
                          value={customLng}
                          onChange={(e) => setCustomLng(e.target.value)}
                          placeholder="e.g. 72.8258"
                          className="bg-background/50 border-border text-foreground dark:text-white h-10 focus:border-emerald-500/50 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                        <Radius className="w-3 h-3" /> Geofence Radius (km)
                      </Label>
                      <Input
                        type="number"
                        value={customRadius}
                        onChange={(e) => setCustomRadius(e.target.value)}
                        placeholder="e.g. 0.5 for 500m"
                        className="bg-background/50 border-border text-foreground dark:text-white h-10 focus:border-emerald-500/50 text-sm"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                  Date
                </Label>
                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="bg-background/50 border-border text-foreground dark:text-white h-12 focus:border-emerald-500/50"
                />
              </div>
              <Button
                onClick={handleCreateEvent}
                disabled={creating || !newEventName}
                className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </span>
                ) : (
                  "Generate QR & Deploy"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

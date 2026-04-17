"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
import { supabase, getUser, signOut } from "@/lib/supabaseClient";
import { useVeNeckStore, OrgProfile } from "@/lib/store";
import {
  Zap,
  ArrowLeft,
  Save,
  AtSign,
  Building2,
  FileText,
  Briefcase,
  ImagePlus,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  User,
  Mail,
  Pencil,
  Trophy,
  Cpu,
  Music,
  GraduationCap,
  Ticket,
  MoreHorizontal,
  Sun,
  Moon,
  Monitor,
  Palette,
} from "lucide-react";

const ORG_TYPES = [
  { value: "sporting_firm", label: "Sporting Firm", icon: Trophy },
  { value: "tech_events", label: "Tech Events / Hackathons", icon: Cpu },
  { value: "entertainment", label: "Entertainment / Concerts", icon: Music },
  { value: "education", label: "Educational Institution", icon: GraduationCap },
  { value: "ticketing", label: "Ticketing Company", icon: Ticket },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const USE_CASES = [
  { value: "sporting_event", label: "Sporting Event" },
  { value: "tech_conference", label: "Tech Conference / Hackathon" },
  { value: "concert", label: "Concert / Music Festival" },
  { value: "exhibition", label: "Exhibition / Trade Fair" },
  { value: "college_fest", label: "College Fest / University Event" },
  { value: "political_rally", label: "Political Rally" },
  { value: "other", label: "Other" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, profile, setProfile } = useVeNeckStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "unchanged">("unchanged");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [customOrgType, setCustomOrgType] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const originalUsername = useRef("");

  // ─── Auth + Load Profile ────────────────────
  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", u.id)
          .single();
        if (data) {
          const p = data as OrgProfile;
          setProfile(p);
          // Populate fields
          setUsername(p.username || "");
          originalUsername.current = p.username || "";
          setOrgName(p.org_name);
          setOrgType(p.org_type);
          setCustomOrgType(p.custom_org_type || "");
          setDescription(p.description);
          setUseCase(p.use_case);
          setLogoUrl(p.logo_url || "");
          setLogoPreview(p.logo_url || "");
        }
      }
      setLoading(false);
    })();
  }, []);

  // Hydration guard for theme
  useEffect(() => setMounted(true), []);

  // ─── Username Check ─────────────────────────
  const checkUsername = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(cleaned);

    if (cleaned === originalUsername.current) {
      setUsernameStatus("unchanged");
      return;
    }

    setUsernameStatus("idle");
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (cleaned.length < 3) return;

    setUsernameStatus("checking");
    usernameTimerRef.current = setTimeout(async () => {
      if (!supabase) { setUsernameStatus("available"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleaned)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);
  };

  // ─── Logo Upload ────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id || "anon"}_${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(data.path);
      setLogoUrl(urlData.publicUrl);
    } catch {
      setError("Logo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Save Profile ──────────────────────────
  const handleSave = async () => {
    if (usernameStatus === "taken") {
      setError("Username is already taken!");
      return;
    }

    setSaving(true);
    setError("");

    const updated: Partial<OrgProfile> = {
      username,
      org_name: orgName,
      org_type: orgType,
      custom_org_type: orgType === "other" ? customOrgType : undefined,
      description,
      use_case: useCase,
      logo_url: logoUrl || undefined,
    };

    if (supabase && profile?.id) {
      try {
        const { error: dbError } = await supabase
          .from("profiles")
          .update(updated)
          .eq("id", profile.id);
        if (dbError) throw dbError;
      } catch (err: any) {
        setError(err.message || "Failed to save.");
        setSaving(false);
        return;
      }
    }

    setProfile({ ...profile!, ...updated } as OrgProfile);
    originalUsername.current = username;
    setUsernameStatus("unchanged");
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push("/login");
  };

  const getOrgTypeLabel = (val: string) => ORG_TYPES.find(t => t.value === val)?.label || val;
  const getUseCaseLabel = (val: string) => USE_CASES.find(t => t.value === val)?.label || val;

  const canSave = username.length >= 3 && usernameStatus !== "taken" && usernameStatus !== "checking" && orgName.trim() && description.trim();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-foreground0 font-mono text-sm uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ─── */}
      <header className="border-b border-border backdrop-blur-md bg-background/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground dark:text-white h-9 w-9 p-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="h-8 w-8 rounded-lg object-cover border border-emerald-500/40" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <span className="text-lg font-black tracking-tight">Settings</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground dark:text-white hover:bg-white/5 gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* ─── Success Banner ─── */}
        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Profile updated successfully!</span>
          </div>
        )}

        {/* ─── Account Info ─── */}
        <Card className="bg-card/50 border-border overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-30" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-emerald-500" />
              Account
            </CardTitle>
            <CardDescription className="text-muted-foreground">Your login credentials — managed by Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl border border-border">
              <div className="h-14 w-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <User className="w-7 h-7 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground dark:text-white truncate">{user?.user_metadata?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 shrink-0" /> {user?.email}
                </p>
                {profile?.username && (
                  <p className="text-sm text-emerald-400 flex items-center gap-1 font-mono">
                    <AtSign className="w-3 h-3 shrink-0" /> {profile.username}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Profile Card ─── */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-emerald-500" />
                Organization Profile
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {editing ? "Edit your organization details below." : "View and manage your organization info."}
              </CardDescription>
            </div>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-white/5 gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {editing ? (
              /* ─── EDIT MODE ─── */
              <div className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Username</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground0">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <Input
                      value={username}
                      onChange={(e) => checkUsername(e.target.value)}
                      className="bg-background/50 border-border text-foreground dark:text-white h-12 pl-10 pr-10 focus:border-emerald-500/50 font-mono"
                      maxLength={30}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                      {(usernameStatus === "available" || usernameStatus === "unchanged") && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                  </div>
                  {usernameStatus === "taken" && <p className="text-[11px] text-rose-400 font-medium">@{username} is already taken</p>}
                  {usernameStatus === "available" && <p className="text-[11px] text-emerald-400 font-medium">@{username} is available</p>}
                </div>

                {/* Org Name */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-background/50 border-border text-foreground dark:text-white h-12 px-4 focus:border-emerald-500/50"
                  />
                </div>

                {/* Org Type */}
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Organization Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ORG_TYPES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOrgType(value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all
                          ${orgType === value
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                            : "bg-background/30 border-border text-muted-foreground hover:border-slate-600"
                          }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                  {orgType === "other" && (
                    <Input
                      value={customOrgType}
                      onChange={(e) => setCustomOrgType(e.target.value)}
                      placeholder="Your org type..."
                      className="bg-background/50 border-border text-foreground dark:text-white h-11 px-4 focus:border-emerald-500/50"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Description</Label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-background/50 border border-border text-foreground dark:text-white rounded-lg px-4 py-3 focus:border-emerald-500/50 resize-none text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Use Case */}
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Primary Use Case</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {USE_CASES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUseCase(value)}
                        className={`p-3 rounded-xl border text-sm text-left transition-all
                          ${useCase === value
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                            : "bg-background/30 border-border text-muted-foreground hover:border-slate-600"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo */}
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Logo</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex items-center gap-4 p-4 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500/40 transition-all group"
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    {logoPreview ? (
                      <div className="relative">
                        <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-emerald-500/30" />
                        {uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <ImagePlus className="w-7 h-7 text-foreground0 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-slate-300">Click to change logo</p>
                      <p className="text-[10px] text-muted-foreground/80">PNG, JPG — Max 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700 text-muted-foreground dark:text-slate-300 hover:bg-white/5 h-12"
                    onClick={() => {
                      setEditing(false);
                      // Reset to stored profile
                      if (profile) {
                        setUsername(profile.username);
                        setOrgName(profile.org_name);
                        setOrgType(profile.org_type);
                        setCustomOrgType(profile.custom_org_type || "");
                        setDescription(profile.description);
                        setUseCase(profile.use_case);
                        setLogoUrl(profile.logo_url || "");
                        setLogoPreview(profile.logo_url || "");
                        setUsernameStatus("unchanged");
                      }
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all gap-2 disabled:opacity-40"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* ─── VIEW MODE ─── */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-background/50 rounded-xl border border-border">
                    <p className="text-[10px] uppercase tracking-widest text-foreground0 font-bold mb-1.5">Username</p>
                    <p className="text-base text-emerald-400 font-mono flex items-center gap-1">
                      <AtSign className="w-4 h-4" />
                      {profile?.username || "—"}
                    </p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-xl border border-border">
                    <p className="text-[10px] uppercase tracking-widest text-foreground0 font-bold mb-1.5">Organization</p>
                    <p className="text-base text-foreground dark:text-white font-semibold">{profile?.org_name || "—"}</p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-xl border border-border">
                    <p className="text-[10px] uppercase tracking-widest text-foreground0 font-bold mb-1.5">Type</p>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                      {getOrgTypeLabel(profile?.org_type || "")}
                    </Badge>
                  </div>
                  <div className="p-4 bg-background/50 rounded-xl border border-border">
                    <p className="text-[10px] uppercase tracking-widest text-foreground0 font-bold mb-1.5">Use Case</p>
                    <Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs">
                      {getUseCaseLabel(profile?.use_case || "")}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-background/50 rounded-xl border border-border">
                  <p className="text-[10px] uppercase tracking-widest text-foreground0 font-bold mb-1.5">Description</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">{profile?.description || "—"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Appearance ─── */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-emerald-500" />
              Appearance
            </CardTitle>
            <CardDescription className="text-muted-foreground">Choose your preferred theme for the interface.</CardDescription>
          </CardHeader>
          <CardContent>
            {mounted && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Light", icon: Sun, preview: "bg-white border-slate-200" },
                  { value: "dark", label: "Dark", icon: Moon, preview: "bg-slate-900 border-slate-700" },
                  { value: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-r from-white to-slate-900 border-slate-500" },
                ].map(({ value, label, icon: Icon, preview }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200
                      ${theme === value
                        ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : "border-border bg-background/30 hover:border-slate-600"
                      }`}
                  >
                    {/* Mini preview */}
                    <div className={`w-full h-12 rounded-lg border ${preview} relative overflow-hidden`}>
                      {value === "light" && (
                        <>
                          <div className="absolute top-2 left-2 w-8 h-1.5 bg-slate-300 rounded-full" />
                          <div className="absolute top-5 left-2 w-12 h-1 bg-slate-200 rounded-full" />
                          <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-400 rounded" />
                        </>
                      )}
                      {value === "dark" && (
                        <>
                          <div className="absolute top-2 left-2 w-8 h-1.5 bg-slate-600 rounded-full" />
                          <div className="absolute top-5 left-2 w-12 h-1 bg-slate-700 rounded-full" />
                          <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded" />
                        </>
                      )}
                      {value === "system" && (
                        <>
                          <div className="absolute top-2 left-2 w-8 h-1.5 bg-slate-400 rounded-full" />
                          <div className="absolute top-5 left-2 w-12 h-1 bg-slate-500 rounded-full" />
                          <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded" />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${theme === value ? "text-emerald-400" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-semibold ${theme === value ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                    {theme === value && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Danger Zone ─── */}
        <Card className="bg-card/50 border-rose-500/10">
          <CardHeader>
            <CardTitle className="text-lg text-rose-400 flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-foreground dark:text-white">Sign out of your account</p>
                <p className="text-xs text-muted-foreground mt-0.5">You will be redirected to the login page.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

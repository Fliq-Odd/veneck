"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { supabase, getUser } from "@/lib/supabaseClient";
import { useVeNeckStore, OrgProfile } from "@/lib/store";
import {
  Zap,
  Building2,
  Upload,
  ImagePlus,
  ChevronRight,
  Trophy,
  Cpu,
  Music,
  GraduationCap,
  Ticket,
  MoreHorizontal,
  CheckCircle2,
  AtSign,
  Loader2,
  XCircle,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────
const ORG_TYPES = [
  { value: "sporting_firm", label: "Sporting Firm", icon: Trophy },
  { value: "tech_events", label: "Tech Events / Hackathons", icon: Cpu },
  { value: "entertainment", label: "Entertainment / Concerts", icon: Music },
  { value: "education", label: "Educational Institution", icon: GraduationCap },
  { value: "ticketing", label: "Ticketing Company", icon: Ticket },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const USE_CASES = [
  { value: "sporting_event", label: "Sporting Event (Cricket, Football, etc.)" },
  { value: "tech_conference", label: "Tech Conference / Hackathon" },
  { value: "concert", label: "Concert / Music Festival" },
  { value: "exhibition", label: "Exhibition / Trade Fair" },
  { value: "college_fest", label: "College Fest / University Event" },
  { value: "political_rally", label: "Political Rally / Public Gathering" },
  { value: "other", label: "Other" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser, setProfile } = useVeNeckStore();

  // ─── Form State ─────────────────────────────
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [customOrgType, setCustomOrgType] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1 = org info, 2 = use case + logo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auth Guard ─────────────────────────────
  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      // Check if profile already exists
      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", u.id)
          .single();
        if (data) {
          setProfile(data as OrgProfile);
          router.push("/dashboard");
        }
      }
    })();
  }, []);

  // ─── Username Uniqueness Check (debounced) ──
  const checkUsername = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(cleaned);
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

  // ─── File Upload (Supabase Storage) ─────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview instantly
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Supabase not configured");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id || "anon"}_${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(data.path);

      setLogoUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Logo upload failed. You can skip this for now.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Save Profile ──────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");

    const profile: OrgProfile = {
      user_id: user?.id || "",
      username,
      org_name: orgName,
      org_type: orgType === "other" ? customOrgType : orgType,
      custom_org_type: orgType === "other" ? customOrgType : undefined,
      description,
      use_case: useCase,
      logo_url: logoUrl || undefined,
    };

    if (supabase) {
      try {
        const { error: dbError } = await supabase
          .from("profiles")
          .insert([profile]);
        if (dbError) throw dbError;
      } catch (err: any) {
        setError(err.message || "Failed to save profile.");
        setSaving(false);
        return;
      }
    }

    setProfile(profile);
    router.push("/dashboard");
  };

  const canProceedStep1 = username.length >= 3 && usernameStatus === "available" && orgName.trim() && orgType && (orgType !== "other" || customOrgType.trim()) && description.trim();
  const canFinish = useCase.trim();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* ─── Background ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[5%] w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full text-primary-foreground" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-primary/8 blur-[140px] rounded-full" />
      </div>

      <div className="w-full max-w-lg z-10 space-y-8">
        {/* ─── Logo + Header ─── */}
        <div className="flex flex-col items-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-center">
            Setup Your <span className="text-primary">Organization</span>
          </h1>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Tell us about your organization so we can personalize your command center.
          </p>
        </div>

        {/* ─── Step Indicator ─── */}
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 w-16 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-primary" : "bg-card"}`} />
          <div className={`h-2 w-16 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-primary" : "bg-card"}`} />
        </div>

        {/* ─── Card ─── */}
        <Card className="backdrop-blur-2xl bg-card/60 border border-border/50 shadow-2xl overflow-hidden relative text-foreground">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          {/* ─── STEP 1: Organization Info ─── */}
          {step === 1 && (
            <>
              <CardHeader className="pt-8 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="w-5 h-5 text-primary" />
                  Organization Details
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Step 1 of 2 — Basic information about your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Username */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                    Username
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground0">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <Input
                      value={username}
                      onChange={(e) => checkUsername(e.target.value)}
                      placeholder="your-unique-handle"
                      className="bg-background/50 border-border placeholder:text-muted-foreground/80 h-12 pl-10 pr-10 focus:border-primary/50 transition-colors font-mono text-foreground"
                      maxLength={30}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                      {usernameStatus === "available" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                  </div>
                  <p className={`text-[11px] font-medium ${
                    usernameStatus === "taken" ? "text-rose-400" :
                    usernameStatus === "available" ? "text-primary" :
                    "text-muted-foreground/80"
                  }`}>
                    {usernameStatus === "idle" && username.length > 0 && username.length < 3 && "Minimum 3 characters"}
                    {usernameStatus === "checking" && "Checking availability..."}
                    {usernameStatus === "available" && `@${username} is available`}
                    {usernameStatus === "taken" && `@${username} is already taken`}
                    {usernameStatus === "idle" && username.length === 0 && "Lowercase letters, numbers, hyphens, underscores"}
                  </p>
                </div>

                {/* Org Name */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                    Organization Name
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g., Mumbai Cricket Association"
                    className="bg-background/50 border-border placeholder:text-muted-foreground/80 h-12 px-4 focus:border-primary/50 transition-colors text-foreground"
                    required
                  />
                </div>

                {/* Org Type */}
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                    Organization Type
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ORG_TYPES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOrgType(value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left text-sm
                          ${orgType === value
                            ? "bg-primary/10 border-primary/40 text-primary shadow-lg shadow-primary/20"
                            : "bg-background/30 border-border text-muted-foreground hover:border-slate-600 hover:text-slate-200"
                          }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{label}</span>
                        {orgType === value && (
                          <CheckCircle2 className="w-4 h-4 ml-auto text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom type input */}
                  {orgType === "other" && (
                    <Input
                      value={customOrgType}
                      onChange={(e) => setCustomOrgType(e.target.value)}
                      placeholder="Enter your organization type..."
                      className="bg-background/50 border-border placeholder:text-muted-foreground/80 h-11 px-4 focus:border-primary/50 transition-colors mt-2 text-foreground"
                      autoFocus
                    />
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                    Short Description
                  </Label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us briefly what your organization does..."
                    rows={3}
                    className="w-full bg-background/50 border border-border placeholder:text-muted-foreground/80 rounded-lg px-4 py-3 focus:border-primary/50 transition-colors resize-none text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                  />
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full h-13 bg-primary hover:bg-primary font-bold text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-40 text-primary-foreground"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </>
          )}

          {/* ─── STEP 2: Use Case + Logo ─── */}
          {step === 2 && (
            <>
              <CardHeader className="pt-8 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Ticket className="w-5 h-5 text-primary" />
                  Use Case &amp; Branding
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Step 2 of 2 — Tell us how you&apos;ll use VeNeck.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Use Case */}
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                    Primary Use Case
                  </Label>
                  <div className="space-y-2">
                    {USE_CASES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUseCase(value)}
                        className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all duration-200 text-left text-sm
                          ${useCase === value
                            ? "bg-primary/10 border-primary/40 text-primary shadow-lg shadow-primary/20"
                            : "bg-background/30 border-border text-muted-foreground hover:border-slate-600 hover:text-slate-200"
                          }`}
                      >
                        <span className="font-medium">{label}</span>
                        {useCase === value && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                    Organization Logo <span className="text-muted-foreground/80">(Optional)</span>
                  </Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group text-primary-foreground"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-24 h-24 rounded-xl object-cover border-2 border-primary/30 shadow-lg shadow-primary/20"
                        />
                        {uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          </div>
                        )}
                        {!uploading && logoUrl && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <CheckCircle2 className="w-4 h-4 text-foreground" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-xl bg-card flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors text-primary-foreground">
                          <ImagePlus className="w-8 h-8 text-foreground0 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm text-foreground0 group-hover:text-muted-foreground  transition-colors">
                          Click to upload your logo
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">
                          PNG, JPG, SVG — Max 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-border text-muted-foreground hover:bg-white/5 h-13 text-foreground"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!canFinish || saving}
                    className="flex-1 h-13 bg-primary hover:bg-primary font-bold text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-lg shadow-primary/20 transition-all disabled:opacity-40 text-primary-foreground"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Launch Dashboard"
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/80 font-mono">
          You can update this later in settings
        </p>
      </div>
    </div>
  );
}

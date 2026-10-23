"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2Icon, LocateFixedIcon, LogInIcon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AccountProfile = {
  display_name: string;
  full_name: string | null;
  account_type: "student" | "working-professional" | null;
  city: string | null;
  neighborhood: string | null;
  bio: string | null;
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: "gps" | "manual" | null;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "LI";
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "avatar";
}

export function AccountDialog({ onSessionChange }: { onSessionChange: (user: User | null, profile: AccountProfile | null) => void }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<"student" | "working-professional" | "">("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadProfile(nextUser: User | null) {
    if (!nextUser || !isSupabaseConfigured()) {
      setProfile(null);
      onSessionChange(nextUser, null);
      return;
    }
    const client = createBrowserSupabaseClient();
    if (!client) return;
    const { data, error: profileError } = await client.from("profiles").select("display_name, full_name, account_type, city, neighborhood, bio, avatar_url, latitude, longitude, location_source").eq("id", nextUser.id).maybeSingle();
    if (profileError) {
      setError(profileError.message);
      return;
    }
    const nextProfile = data ?? null;
    setProfile(nextProfile);
    setDisplayName(nextProfile?.full_name ?? nextProfile?.display_name ?? "");
    setAccountType(nextProfile?.account_type ?? "");
    setCity(nextProfile?.city ?? "");
    setNeighborhood(nextProfile?.neighborhood ?? "");
    setBio(nextProfile?.bio ?? "");
    setCoordinates(nextProfile?.latitude === null || nextProfile?.longitude === null || !nextProfile ? null : { lat: Number(nextProfile.latitude), lng: Number(nextProfile.longitude) });
    onSessionChange(nextUser, nextProfile);
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = createBrowserSupabaseClient();
    if (!client) return;
    void client.auth.getUser().then(({ data }) => {
      setUser(data.user);
      void loadProfile(data.user);
    });
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void loadProfile(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
    // The auth client is a stable cookie-backed singleton for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInOrUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase credentials are not configured.");
      return;
    }
    if (!email.includes("@") || password.length < 8 || (mode === "sign-up" && (!displayName.trim() || !accountType || !city.trim() || !neighborhood.trim()))) {
      setError("Enter a valid email, an 8-character password, name, account type, city, and neighborhood.");
      return;
    }
    setBusy(true);
    setError(null);
    const client = createBrowserSupabaseClient();
    if (!client) {
      setBusy(false);
      setError("Supabase credentials are not configured.");
      return;
    }
    try {
      const result = mode === "sign-in"
        ? await client.auth.signInWithPassword({ email: email.trim(), password })
        : await client.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { full_name: displayName.trim(), account_type: accountType, city: city.trim(), neighborhood: neighborhood.trim() },
            },
          });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (mode === "sign-up" && !result.data.session) {
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("sign-in");
        return;
      }
      setPassword("");
      setOpen(false);
      toast.success(mode === "sign-in" ? "Signed in." : "Account created.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication request failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const name = displayName.trim();
    if (name.length < 1 || name.length > 80 || !accountType || !city.trim() || !neighborhood.trim()) {
      setError("Name, account type, city, and neighborhood are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const client = createBrowserSupabaseClient();
    if (!client) return;
    let avatarUrl = profile?.avatar_url ?? null;
    if (avatar) {
      if (!avatar.type.startsWith("image/") || avatar.size > 5 * 1024 * 1024) {
        setBusy(false);
        setError("Choose an image no larger than 5 MB.");
        return;
      }
      const path = `${user.id}/${crypto.randomUUID()}-${safeFileName(avatar.name)}`;
      const { error: uploadError } = await client.storage.from("profile-avatars").upload(path, avatar, { contentType: avatar.type, upsert: false });
      if (uploadError) {
        setBusy(false);
        setError(uploadError.message);
        return;
      }
      avatarUrl = client.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
    }
    const { error: saveError } = await client.from("profiles").upsert({
      id: user.id, display_name: name, full_name: name, account_type: accountType,
      city: city.trim(), neighborhood: neighborhood.trim(), bio: bio.trim() || null,
      avatar_url: avatarUrl, latitude: coordinates?.lat ?? null, longitude: coordinates?.lng ?? null,
      location_source: coordinates ? "gps" : null,
    });
    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setAvatar(null);
    if (inputRef.current) inputRef.current.value = "";
    await loadProfile(user);
    toast.success("Profile saved.");
  }

  async function signOut() {
    const client = createBrowserSupabaseClient();
    if (!client) return;
    setBusy(true);
    const { error: signOutError } = await client.auth.signOut();
    setBusy(false);
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    setOpen(false);
    toast.success("Signed out.");
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser. Enter city and neighborhood manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        toast.success("Location captured. Save your profile to store it.");
      },
      () => setError("Location permission was denied. Your manual city and neighborhood remain unchanged."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  const label = user ? profile?.display_name ?? "Account" : "Sign in";
  const isAuthFormValid = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length >= 8 &&
    (mode === "sign-in" || Boolean(displayName.trim() && accountType && city.trim() && neighborhood.trim()));
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => { setError(null); setOpen(true); }}>
        {user ? (
          <Avatar size="sm" data-icon="inline-start">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{initials(profile?.display_name ?? user.email ?? "Local Intel")}</AvatarFallback>
          </Avatar>
        ) : <LogInIcon data-icon="inline-start" />}
        <span className="hidden sm:inline">{label}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{user ? "Your profile" : mode === "sign-in" ? "Sign in" : "Create an account"}</DialogTitle>
            <DialogDescription>
              {user ? "Manage the identity used for reports, comments, votes, and saved issues." : "Sign in to report, comment, vote, and save issues."}
            </DialogDescription>
          </DialogHeader>
          {user ? (
            <form className="grid gap-4" onSubmit={saveProfile}>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{initials(profile?.display_name ?? user.email ?? "Local Intel")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm text-muted-foreground">{user.email}</div>
              </div>
              <label className="grid gap-1.5 text-sm font-medium">Display name
                <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} disabled={busy} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Account type
                <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={accountType} onChange={(event) => setAccountType(event.target.value as typeof accountType)} disabled={busy}>
                  <option value="">Select account type</option><option value="student">Student</option><option value="working-professional">Working Professional</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">City
                <Input value={city} onChange={(event) => setCity(event.target.value)} maxLength={120} disabled={busy} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Neighborhood
                <Input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} maxLength={120} disabled={busy} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Bio <span className="font-normal text-muted-foreground">(optional)</span>
                <Input value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} disabled={busy} />
              </label>
              <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={captureLocation} disabled={busy}><LocateFixedIcon data-icon="inline-start" />{coordinates ? "Location captured" : "Use my location"}</Button>
              <label className="grid gap-1.5 text-sm font-medium">Avatar
                <Input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setAvatar(event.target.files?.[0] ?? null)} disabled={busy} />
              </label>
              {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={signOut} disabled={busy}><LogOutIcon data-icon="inline-start" />Sign out</Button>
                <Button type="submit" disabled={busy}>{busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}Save profile</Button>
              </DialogFooter>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={signInOrUp}>
              <label className="grid gap-1.5 text-sm font-medium">Email
                <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} required />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Password
                <Input type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} disabled={busy} required />
              </label>
              {mode === "sign-up" ? <>
                <label className="grid gap-1.5 text-sm font-medium">Full / display name
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} disabled={busy} required />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">Account type
                  <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={accountType} onChange={(event) => setAccountType(event.target.value as typeof accountType)} disabled={busy} required>
                    <option value="">Select account type</option><option value="student">Student</option><option value="working-professional">Working Professional</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">City
                  <Input value={city} onChange={(event) => setCity(event.target.value)} maxLength={120} disabled={busy} required />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">Neighborhood
                  <Input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} maxLength={120} disabled={busy} required />
                </label>
              </> : null}
              {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
              <DialogFooter className="sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(null); }} disabled={busy}>
                  {mode === "sign-in" ? "Create an account" : "I already have an account"}
                </Button>
                <Button type="submit" disabled={busy || !isSupabaseConfigured() || !isAuthFormValid}>{busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}{mode === "sign-in" ? "Sign in" : "Sign up"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

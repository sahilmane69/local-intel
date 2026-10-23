"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2Icon, LogInIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AccountProfile = { display_name: string; avatar_url: string | null; neighborhood: string | null };

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
    const { data, error: profileError } = await client.from("profiles").select("display_name, avatar_url, neighborhood").eq("id", nextUser.id).maybeSingle();
    if (profileError) {
      setError(profileError.message);
      return;
    }
    const nextProfile = data ?? null;
    setProfile(nextProfile);
    setDisplayName(nextProfile?.display_name ?? "");
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
    if (!email.includes("@") || password.length < 8) {
      setError("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const client = createBrowserSupabaseClient();
    if (!client) return;
    const result = mode === "sign-in"
      ? await client.auth.signInWithPassword({ email, password })
      : await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
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
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const name = displayName.trim();
    if (name.length < 1 || name.length > 80) {
      setError("Display name must be between 1 and 80 characters.");
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
    const { error: saveError } = await client.from("profiles").upsert({ id: user.id, display_name: name, avatar_url: avatarUrl });
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

  const label = user ? profile?.display_name ?? "Account" : "Sign in";
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => { setError(null); setOpen(true); }}>
        {user ? <UserRoundIcon data-icon="inline-start" /> : <LogInIcon data-icon="inline-start" />}
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
              {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
              <DialogFooter className="sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(null); }} disabled={busy}>
                  {mode === "sign-in" ? "Create an account" : "I already have an account"}
                </Button>
                <Button type="submit" disabled={busy || !isSupabaseConfigured()}>{busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}{mode === "sign-in" ? "Sign in" : "Sign up"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

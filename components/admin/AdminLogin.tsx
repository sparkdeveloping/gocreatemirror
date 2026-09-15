"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="admin-login-shell">
    <form className="admin-login-card" onSubmit={submit}>
      <div className="admin-login-mark"><Image src="/brand/gocreate-icon.png" alt="GoCreate" width={82} height={78} priority /></div>
      <div className="admin-kicker">GOCREATE MIRROR STUDIO</div>
      <h1>Admin access</h1>
      <p>Enter the admin PIN once. This browser stays signed in for seven days, so layout changes no longer ask for a PIN every time.</p>
      <label><span>ADMIN PIN</span><input autoFocus inputMode="numeric" autoComplete="current-password" type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="••••" /></label>
      {error && <div className="admin-login-error">{error}</div>}
      <button type="submit" disabled={busy || !pin}>{busy ? "Unlocking…" : "Open Mirror Studio"}</button>
      <small>PIN is verified server-side and stored only as a signed HTTP-only session cookie.</small>
    </form>
  </main>;
}

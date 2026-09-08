"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const SANS = { fontFamily: "var(--font-inter), sans-serif" };

function LoginForm() {
  const params = useSearchParams();

  // Only ever follow a same-origin path. `next` arrives in the URL, so without
  // this the login page would forward anyone who clicked a crafted link to an
  // attacker's site carrying the trust of this domain.
  const requested = params.get("next") || "/team";
  const next =
    requested.startsWith("/") &&
    !requested.startsWith("//") &&
    !requested.startsWith("/\\")
      ? requested
      : "/team";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/team-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Wrong password.");
        setBusy(false);
        return;
      }
      // Full reload so the proxy sees the new cookie on the next request.
      window.location.href = next;
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <label htmlFor="password" className="mb-2 block text-base text-gray">
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        className="w-full rounded-lg border border-gray-border bg-white px-5 py-3 text-base text-foreground outline-none transition-colors focus:border-foreground"
      />

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy || !password.trim()}
        className="mt-5 w-full rounded-lg border border-foreground bg-foreground px-10 py-3 text-base font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        {busy ? "Checking..." : "Enter"}
      </button>
    </form>
  );
}

export default function TeamLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1
          className="text-3xl font-medium italic tracking-tight"
          style={{
            fontFamily: "var(--font-garamond), Georgia, serif",
            color: "#1a5a8a",
          }}
        >
          What James Will Ask
        </h1>
        <p className="mt-3 text-lg text-gray" style={SANS}>
          For the team. Ask James for the password.
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

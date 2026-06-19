"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Could not sign in");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/icon-192x192.png"
            alt="Harmony Garden"
            width={64}
            height={64}
            className="rounded-xl mb-4"
          />
          <h1 className="text-xl font-bold text-neutral-900">Galadima</h1>
          <p className="text-sm text-neutral-500 mt-1">Harmony Garden Workspace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-7"
        >
          <h2 className="text-base font-semibold text-neutral-900 mb-1">Sign in</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Use the email and password your admin gave you.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-sm">
              {error}
            </div>
          )}

          <label className="block mb-4">
            <span className="block text-sm font-medium text-neutral-700 mb-1.5">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@harmonygarden.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-muted)]"
            />
          </label>

          <label className="block mb-6">
            <span className="block text-sm font-medium text-neutral-700 mb-1.5">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-900 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-muted)]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Don&apos;t have an account? Your admin creates it for you — there&apos;s no sign-up here.
        </p>
      </div>
    </main>
  );
}
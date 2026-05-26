"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done")
    return (
      <p className="text-sm font-medium text-green-300">
        ✓ You&apos;re on the list — thanks for subscribing!
      </p>
    );

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full flex-1 rounded-lg border border-white/20 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        disabled={state === "loading"}
        className="shrink-0 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {state === "loading" ? "…" : "Subscribe"}
      </button>
      {state === "error" && (
        <span className="text-sm text-red-300 sm:self-center">Try again</span>
      )}
    </form>
  );
}

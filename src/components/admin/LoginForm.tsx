"use client";

import { useState } from "react";

export function LoginForm() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) location.reload();
    else setError("Invalid admin token");
  }

  return (
    <div className="mx-auto max-w-sm mt-20">
      <h1 className="text-2xl font-bold mb-4">Admin sign-in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_TOKEN"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <button className="w-full rounded-lg bg-brand py-2 font-semibold text-white hover:bg-brand-dark">
          Sign in
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
      <p className="mt-3 text-xs text-slate-500">
        The token is the <code>ADMIN_TOKEN</code> value from your <code>.env</code>.
      </p>
    </div>
  );
}

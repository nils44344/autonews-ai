"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function TriggerTrendButton() {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function run() {
    start(async () => {
      const res = await fetch("/api/admin/trigger", { method: "POST" });
      setMsg(res.ok ? "Trend cycle queued ✓" : "Failed");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Queuing…" : "Run trend cycle now"}
      </button>
      {msg && <span className="text-sm text-slate-500">{msg}</span>}
    </div>
  );
}

export function ReviewButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function act(action: "approve" | "reject") {
    start(async () => {
      await fetch("/api/admin/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("approve")}
        disabled={pending}
        className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve & publish
      </button>
      <button
        onClick={() => act("reject")}
        disabled={pending}
        className="rounded bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}

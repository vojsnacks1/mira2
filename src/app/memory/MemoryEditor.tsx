"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { saveMemory, clearMemory } from "./actions";

interface MemoryEditorProps {
  initialContent: string;
}

export default function MemoryEditor({ initialContent }: MemoryEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "clearing">("idle");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setStatus("saving");
    setMessage(null);
    const result = await saveMemory(content);
    if ("error" in result) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Memory saved." });
    }
    setStatus("idle");
  }

  async function handleClear() {
    setStatus("clearing");
    setMessage(null);
    const result = await clearMemory();
    if ("error" in result) {
      setMessage({ type: "error", text: result.error });
    } else {
      setContent("");
      setMessage({ type: "success", text: "Memory cleared." });
    }
    setStatus("idle");
  }

  const busy = status !== "idle";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <img
              src="/marcus-avatar.png"
              alt="Marcus"
              className="h-8 w-8 rounded-full object-cover"
            />
          </Link>
          <div>
            <p className="text-sm font-medium text-foreground">Marcus</p>
            <p className="text-xs text-muted">Stoic philosopher</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            ← Back to chat
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-xl font-semibold text-foreground mb-1">
            What Marcus Remembers
          </h1>
          <p className="text-sm text-muted mb-8">
            Marcus carries knowledge of you across every conversation. Edit or clear it below.
          </p>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={busy}
            rows={10}
            placeholder="Nothing saved yet. Marcus will automatically build up context as you chat."
            className="w-full rounded-2xl border border-border bg-white px-5 py-4 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent resize-none disabled:opacity-60 leading-6"
          />

          {message && (
            <p
              className={`mt-3 text-xs ${
                message.type === "success" ? "text-muted" : "text-red-500"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex h-10 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {status === "saving" ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleClear}
              disabled={busy}
              className="flex h-10 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              {status === "clearing" ? "Clearing…" : "Clear"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

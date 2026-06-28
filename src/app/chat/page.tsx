"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Message = { id: string; role: "user" | "assistant"; text: string };

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I'm Mira. What's on your mind?",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
    };

    const history = [...messages.filter((m) => m.id !== "welcome"), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", text: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.text })),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, text: m.text + chunk } : m,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-background"
          >
            M
          </Link>
          <div>
            <p className="text-sm font-medium text-foreground">Mira</p>
            <p className="text-xs text-muted">Your AI assistant</p>
          </div>
        </div>
        <UserButton />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm leading-6 text-background"
                    : "max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-white px-4 py-2.5 text-sm leading-6 text-foreground"
                }
              >
                {msg.text || (
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          ))}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border px-4 py-4"
      >
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Mira…"
            disabled={loading}
            className="flex-1 rounded-full border border-border bg-white px-5 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

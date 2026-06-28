"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const WELCOME: Message = {
  id: 0,
  role: "assistant",
  text: "Hi, I'm Mira. I'm not connected to a real AI brain just yet. For now, type anything and I'll show you where my replies will appear.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
    const reply: Message = {
      id: Date.now() + 1,
      role: "assistant",
      text: "Got it. Once I'm connected to an AI model, I'll give you a real answer here.",
    };

    setMessages((prev) => [...prev, userMsg, reply]);
    setInput("");
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
              className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm leading-6 text-background"
                    : "max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-white px-4 py-2.5 text-sm leading-6 text-foreground"
                }
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="border-t border-border px-4 py-4">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Mira…"
            className="flex-1 rounded-full border border-border bg-white px-5 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

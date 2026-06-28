"use client";

import { useChat } from "@ai-sdk/react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      streamProtocol: "text",
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi, I'm Mira. What's on your mind?",
        },
      ],
    });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border bg-white px-4 py-2.5">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border px-4 py-4">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Message Mira…"
            disabled={isLoading}
            className="flex-1 rounded-full border border-border bg-white px-5 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

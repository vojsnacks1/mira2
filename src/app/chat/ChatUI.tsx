"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { id: string; role: "user" | "assistant"; text: string };
type Conversation = { id: string; title: string; updatedAt: Date | string };

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "Salve. I am Marcus Aurelius, philosopher and emperor of Rome. What troubles your mind today, citizen?",
};

interface ChatUIProps {
  initialConversations: Conversation[];
}

export default function ChatUI({ initialConversations }: ChatUIProps) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(() => {
    if (initialConversations.length > 0) return initialConversations[0].id;
    return null;
  });
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load messages whenever the active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([WELCOME]);
      return;
    }
    setMessages([WELCOME]);
    fetch(`/api/conversations/${activeConversationId}/messages`)
      .then((r) => r.json())
      .then(
        (data: { id: string; role: string; content: string }[]) => {
          if (data.length === 0) {
            setMessages([WELCOME]);
          } else {
            setMessages(
              data.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                text: m.content,
              })),
            );
          }
        },
      )
      .catch(() => setMessages([WELCOME]));
  }, [activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startNewConversation() {
    const newId = crypto.randomUUID();
    setActiveConversationId(newId);
    setMessages([WELCOME]);
    setInput("");
    setError(null);
  }

  async function refreshConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // best effort
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = crypto.randomUUID();
      setActiveConversationId(conversationId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
    };

    // Only send the last 10 messages — long-term context is handled by the memory system
    const allHistory = [...messages.filter((m) => m.id !== "welcome"), userMsg];
    const history = allHistory.slice(-10);
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
          conversationId,
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

      // Refresh conversations to pick up newly created entry + updated title
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-[#F5EFE4] transition-all duration-200 ${
          sidebarOpen ? "w-64 min-w-[16rem]" : "w-0 min-w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Conversations
          </span>
        </div>

        <div className="p-3">
          <button
            onClick={startNewConversation}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-accent px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New conversation
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {conversations.length === 0 && (
            <p className="px-1 py-2 text-xs text-muted">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`mb-1 flex w-full items-start rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                conv.id === activeConversationId
                  ? "bg-[#E8DDD0] font-medium text-foreground"
                  : "text-foreground hover:bg-[#EDE6D8]"
              }`}
            >
              <span className="line-clamp-2 leading-5">{conv.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="rounded-md p-1 text-muted hover:text-foreground transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
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
              href="/memory"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Memory
            </Link>
            <UserButton />
          </div>
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
                      ? "max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm leading-6 text-white"
                      : "max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-background px-4 py-2.5 text-sm leading-6 text-foreground"
                  }
                >
                  {msg.role === "assistant" ? (
                    msg.text ? (
                      <div className="prose prose-sm max-w-none text-foreground prose-p:my-1 prose-headings:text-foreground prose-strong:text-foreground prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-100 prose-pre:text-foreground prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-li:my-0.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                      </span>
                    )
                  ) : (
                    msg.text
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
              placeholder="Seek counsel from Marcus…"
              disabled={loading}
              className="flex-1 rounded-full border border-border bg-white px-5 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Ask
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

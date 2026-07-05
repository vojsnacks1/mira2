import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-xl flex-col items-center text-center">
        <img
          src="/marcus-avatar.png"
          alt="Marcus Aurelius"
          className="mb-6 h-28 w-28 rounded-full object-cover border-4 border-border shadow-md"
        />

        <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Marcus Aurelius
        </h1>
        <p className="mt-2 text-base text-muted">
          Philosopher. Emperor. Your guide.
        </p>

        <p className="mt-6 max-w-md text-lg leading-8 text-muted">
          Ask anything. Receive wisdom. Face your day with clarity.
        </p>

        <blockquote className="mt-8 max-w-md border-l-2 border-accent pl-4 text-left text-sm italic text-muted leading-7">
          "You have power over your mind, not outside events. Realize this, and
          you will find strength."
        </blockquote>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          {userId ? (
            <Link
              href="/chat"
              className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-base font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Enter the forum
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-base font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Begin your journey
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-8 text-base font-medium text-foreground transition-opacity hover:opacity-90"
              >
                Return
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-sm text-muted">
          Your conversations are private to you.
        </p>
      </main>
    </div>
  );
}

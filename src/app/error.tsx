"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-1 font-mono text-xs text-red-600">{error.message}</p>
        {error.digest && (
          <p className="mt-1 text-xs text-red-400">digest: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

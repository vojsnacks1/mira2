"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body>
        <div style={{ fontFamily: "monospace", padding: "2rem", maxWidth: "600px", margin: "auto" }}>
          <h2 style={{ color: "red" }}>Application Error</h2>
          <p><strong>Message:</strong> {error.message}</p>
          {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
          <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto", fontSize: "12px" }}>
            {error.stack}
          </pre>
        </div>
      </body>
    </html>
  );
}

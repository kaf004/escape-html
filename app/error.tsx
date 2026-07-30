"use client";

export default function ErrorFallback({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-fallback">
      <p>ESCAPE.HTML / RECOVERY MODE</p>
      <h1>The interface failed to hold its shape.</h1>
      <button onClick={reset}>REASSEMBLE</button>
    </main>
  );
}

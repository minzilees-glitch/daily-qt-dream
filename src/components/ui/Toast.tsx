"use client";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast pointer-events-none fixed bottom-28 left-1/2 z-50 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-[var(--radius-md)] bg-text-main/95 px-4 py-3 text-center type-body-sm font-medium text-white shadow-none backdrop-blur"
    >
      {message}
    </div>
  );
}

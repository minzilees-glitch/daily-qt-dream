"use client";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast pointer-events-none fixed bottom-28 left-1/2 z-50 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-[#243746]/95 px-4 py-3 text-center text-[15px] font-medium text-white shadow-none backdrop-blur"
    >
      {message}
    </div>
  );
}

import type { ReactNode } from "react";

/** Left-aligned tab page chrome title (not inside SoftCards). */
export function PageTitle({
  children,
  light = false,
  className = "",
}: {
  children: ReactNode;
  /** White text on hero-gradient. */
  light?: boolean;
  className?: string;
}) {
  return (
    <h1
      className={`pt-[calc(12px+var(--safe-top))] text-left text-[26px] font-bold tracking-[0.04em] ${
        light ? "text-white" : "text-text-main"
      } ${className}`}
    >
      {children}
    </h1>
  );
}

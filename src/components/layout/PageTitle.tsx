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
      className={`type-page-title pt-[calc(var(--space-title-pt)+var(--safe-top))] text-left ${
        light ? "text-white" : "text-text-main"
      } ${className}`}
    >
      {children}
    </h1>
  );
}

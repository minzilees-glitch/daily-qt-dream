import type { ReactNode } from "react";

export function SoftCard({
  children,
  className = "",
  padding = "p-5",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`soft-card ${padding} ${className}`}>{children}</div>
  );
}

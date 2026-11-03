import type { ReactNode } from "react";

export function SoftCard({
  children,
  className = "",
  padding = "p-5",
  id,
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`soft-card ${padding} ${className}`}>
      {children}
    </div>
  );
}

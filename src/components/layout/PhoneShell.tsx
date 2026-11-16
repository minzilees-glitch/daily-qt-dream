import type { ReactNode } from "react";

export function PhoneShell({
  children,
  "data-nav": dataNav,
}: {
  children: ReactNode;
  /** When `hidden`, QT save CTA sticks to the true viewport bottom. */
  "data-nav"?: "docked" | "hidden";
}) {
  return (
    <div className="phone-shell" data-nav={dataNav}>
      {children}
    </div>
  );
}

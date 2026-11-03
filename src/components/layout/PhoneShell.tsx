import type { ReactNode } from "react";

export function PhoneShell({ children }: { children: ReactNode }) {
  return <div className="phone-shell">{children}</div>;
}

import type { ReactNode } from "react";

/** Phone column: fixed height so BottomNav can pin to the shell bottom. */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="phone-shell flex flex-col">{children}</div>
  );
}

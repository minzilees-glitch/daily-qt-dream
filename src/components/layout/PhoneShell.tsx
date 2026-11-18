import type { ReactNode } from "react";

type PhoneShellScroll = "inner" | "page";

/**
 * `inner` (default): fixed-height shell + nested `.phone-scroll` (main tabs + nav).
 * `page`: shell itself scrolls — use on long auth forms (verify/login) where nested
 * overflow + transform is unreliable in iOS / Kakao WebViews.
 */
export function PhoneShell({
  children,
  scroll = "inner",
}: {
  children: ReactNode;
  scroll?: PhoneShellScroll;
}) {
  const scrollClass = scroll === "page" ? "phone-shell--page-scroll" : "";
  return (
    <div className={["phone-shell", scrollClass].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

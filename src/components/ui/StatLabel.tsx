import type { ElementType, ReactNode } from "react";

/** Global metric / caption label (우리순 stat style). */
export const STAT_LABEL_CLASS = "text-[13px] font-bold tracking-[0.06em]";

export function StatLabel({
  children,
  className = "",
  as: Tag = "p",
}: {
  children: ReactNode;
  /** Preserve context color, e.g. text-text-secondary or text-white/85. */
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={`${STAT_LABEL_CLASS} ${className}`}>{children}</Tag>;
}

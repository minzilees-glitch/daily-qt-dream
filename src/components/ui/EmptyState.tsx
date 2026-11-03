import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon ? <div className="mb-2 text-sky">{icon}</div> : null}
      <p className="text-base font-semibold text-text-main">{title}</p>
      {description ? (
        <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}

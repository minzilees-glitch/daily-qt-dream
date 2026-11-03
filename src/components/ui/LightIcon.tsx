import { Sun } from "lucide-react";

/** Active = QT completed that day (1 light collected). */
export function LightIcon({
  active,
  size = 18,
  className = "",
}: {
  active: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${
        active
          ? "bg-sky-light text-sky"
          : "bg-ivory text-text-secondary/30"
      } ${className}`}
      style={{ width: size + 14, height: size + 14 }}
      aria-label={active ? "빛 수집됨" : "빛 미수집"}
      title={active ? "빛 수집됨" : "빛 미수집"}
    >
      <Sun
        size={size}
        strokeWidth={active ? 2.2 : 1.5}
        fill={active ? "currentColor" : "none"}
        aria-hidden
      />
    </span>
  );
}

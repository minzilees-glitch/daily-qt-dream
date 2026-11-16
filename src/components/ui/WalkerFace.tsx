import type { CSSProperties } from "react";
import type { User } from "@/types";

/**
 * Walker head: same profile thumbnail as home/mypage (`User.avatarUrl`).
 * No photo → circle with first letter of nickname (mypage default).
 */
export function WalkerFace({
  user,
  size,
  style,
  className = "",
}: {
  user: Pick<User, "name" | "avatarUrl">;
  size: number;
  style?: CSSProperties;
  className?: string;
}) {
  const avatar = user.avatarUrl ?? null;

  return (
    <span
      className={`pointer-events-none absolute left-1/2 z-[3] flex -translate-x-1/2 items-center justify-center overflow-hidden rounded-full ${
        avatar
          ? "bg-white"
          : "bg-sky-light font-semibold text-[var(--color-ink-blue)]"
      } ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.42)),
        ...style,
      }}
      aria-hidden
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        user.name.slice(0, 1)
      )}
    </span>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost" | "soft";
};

export function PrimaryButton({
  children,
  className = "",
  variant = "primary",
  ...rest
}: Props) {
  /* All CTAs (primary / soft share / ghost): always bold — beats .type-body 400. */
  const base =
    "type-body !font-bold inline-flex items-center justify-center gap-2 rounded-[var(--radius-btn)] px-[var(--space-control-x)] py-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "!bg-[var(--color-sky)] !py-[18px] !text-[var(--color-ink-blue)] shadow-none hover:brightness-105 [&_svg]:!text-[var(--color-ink-blue)]"
      : variant === "soft"
        ? "bg-sky-light !font-bold text-text-main"
        : "bg-transparent !font-bold text-text-secondary hover:text-text-main";

  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

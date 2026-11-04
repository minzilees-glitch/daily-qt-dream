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
  const base =
    "type-body inline-flex items-center justify-center gap-2 rounded-[var(--radius-btn)] px-5 py-3.5 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "btn-cta bg-cta !text-white shadow-none hover:brightness-105 [&_svg]:!text-white"
      : variant === "soft"
        ? "bg-sky-light text-text-main hover:bg-sky-soft"
        : "bg-transparent text-text-secondary hover:text-text-main";

  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

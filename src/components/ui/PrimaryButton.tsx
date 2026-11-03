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
    "inline-flex items-center justify-center gap-2 rounded-[18px] px-5 py-3.5 text-[15px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-sky text-white shadow-[0_10px_24px_rgba(95,188,252,0.35)] hover:brightness-105"
      : variant === "soft"
        ? "bg-sky-light text-text-main hover:bg-[#dceef8]"
        : "bg-transparent text-text-secondary hover:text-text-main";

  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

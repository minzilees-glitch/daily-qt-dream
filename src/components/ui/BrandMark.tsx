/** Shared brand mark: sky tile + white light spark (`--radius-brand` = 28). */
export function BrandMark({
  size = 80,
  className = "",
  /** Override corner radius; default uses `--radius-brand` (28px). */
  rounded,
}: {
  size?: number;
  className?: string;
  rounded?: number | string;
}) {
  const spark = Math.round(size * 0.68);
  return (
    <div
      className={`flex shrink-0 items-center justify-center shadow-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ?? "var(--radius-brand)",
        backgroundColor: "var(--sky)",
      }}
      aria-hidden
    >
      <span
        className="inline-block"
        style={{
          width: spark,
          height: spark,
          backgroundColor: "var(--white)",
          WebkitMaskImage: "url(/icons/light-icon.png)",
          maskImage: "url(/icons/light-icon.png)",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </div>
  );
}

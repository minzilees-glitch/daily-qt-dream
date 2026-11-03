/** Shared brand mark: sky (#5FBCFC) tile + white light spark. */
export function BrandMark({
  size = 80,
  className = "",
  rounded = 28,
}: {
  size?: number;
  className?: string;
  rounded?: number;
}) {
  const spark = Math.round(size * 0.68);
  return (
    <div
      className={`flex shrink-0 items-center justify-center shadow-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: "#5FBCFC",
      }}
      aria-hidden
    >
      <span
        className="inline-block"
        style={{
          width: spark,
          height: spark,
          backgroundColor: "#FFFFFF",
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

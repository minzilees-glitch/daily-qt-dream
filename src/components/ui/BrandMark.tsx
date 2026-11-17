/** Shared brand mark: Maeil QT Bible tile (sky art). */
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/brand-maeil-qt.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-cover shadow-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ?? "var(--radius-brand)",
      }}
      aria-hidden
      draggable={false}
    />
  );
}

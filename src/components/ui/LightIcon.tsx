/** Official 빛 asset — white spark masked to yellow (active) or muted gray. */

const SRC = "/icons/light-icon.png";

type Tone = "active" | "inactive" | "onDark";

function toneColor(tone: Tone): string {
  switch (tone) {
    case "active":
      return "#F5C518";
    case "onDark":
      return "#FFE066";
    case "inactive":
    default:
      return "#C2CAD2";
  }
}

export function LightIcon({
  active = true,
  tone,
  size = 18,
  className = "",
  label,
}: {
  /** Shorthand: true = yellow, false = muted. Ignored when `tone` is set. */
  active?: boolean;
  tone?: Tone;
  size?: number;
  className?: string;
  label?: string;
}) {
  const resolved: Tone = tone ?? (active ? "active" : "inactive");
  const aria =
    label ??
    (resolved === "inactive" ? "빛 미수집" : "빛 수집됨");

  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: toneColor(resolved),
        WebkitMaskImage: `url(${SRC})`,
        maskImage: `url(${SRC})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      role="img"
      aria-label={aria}
      title={aria}
    />
  );
}

/** Icon + count for rankings / stats rows. */
export function LightCount({
  lights,
  size = 16,
  tone = "active",
  className = "",
  textClassName = "text-[15px] font-semibold text-text-main",
}: {
  lights: number;
  size?: number;
  tone?: Tone;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <LightIcon tone={tone} size={size} label={`빛 ${lights}`} />
      <span className={textClassName}>{lights}</span>
    </span>
  );
}

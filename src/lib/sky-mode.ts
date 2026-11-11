/** 낮모드 / 밤모드 — Asia/Seoul wall-clock chrome for sky headers. */

export const SKY_MODE_ATTR = "data-sky-mode";
export const SKY_MODE_NAT = "낮모드";
export const SKY_MODE_BAM = "밤모드";

export type SkyMode = typeof SKY_MODE_NAT | typeof SKY_MODE_BAM;

const SEOUL = "Asia/Seoul";

function seoulHourMinute(date: Date = new Date()): {
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: SEOUL,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return { hour: Number(parts.hour), minute: Number(parts.minute) };
}

/**
 * 밤모드 (Asia/Seoul): 19:00–06:00 (19:00 포함, 06:00 제외).
 * 그 외 = 낮모드. Header / MeSky / SkyWalkers solid fill.
 */
export function isBamModeSeoul(date: Date = new Date()): boolean {
  const { hour } = seoulHourMinute(date);
  return hour >= 19 || hour < 6;
}

export function skyModeSeoul(date: Date = new Date()): SkyMode {
  return isBamModeSeoul(date) ? SKY_MODE_BAM : SKY_MODE_NAT;
}

/** ms until the next 06:00 or 19:00 Seoul boundary (min 1s). */
export function msUntilSkyModeChange(date: Date = new Date()): number {
  const { hour, minute } = seoulHourMinute(date);
  const minutesNow = hour * 60 + minute;
  const boundaries = [6 * 60, 19 * 60, 24 * 60 + 6 * 60]; // next 06:00
  const next = boundaries.find((b) => b > minutesNow) ?? boundaries[0];
  const deltaMin = next - minutesNow;
  return Math.max(1000, deltaMin * 60_000);
}

/** Inline + client bootstrap snippet for `html[data-sky-mode]`. */
export const SKY_MODE_BOOTSTRAP = `(function(){try{var h=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Seoul",hour:"2-digit",hourCycle:"h23"}).format(new Date()));document.documentElement.setAttribute("data-sky-mode",(h>=19||h<6)?"밤모드":"낮모드");}catch(e){}})();`;

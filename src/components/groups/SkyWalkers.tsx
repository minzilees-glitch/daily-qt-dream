"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LightCount, LightIcon } from "@/components/ui/LightIcon";
import { StatLabel } from "@/components/ui/StatLabel";
import type { User } from "@/types";

/** Hard visual max for decorative sky lights. */
const SKY_LIGHT_HARD_MAX = 64;

/** Four discrete sizes (~11px baseline +5%): smaller / base / larger / largest. */
const SKY_LIGHT_SIZES = [8.4, 10.5, 12.6, 14.7] as const;

/** Bump hash salt when board layout changes so sparks re-place on the new sky. */
const SKY_LAYOUT_SALT = 20261103.52;

/** Walker figure metrics (after body shrink + face +10%). */
const WALKER_FACE_PX = 35; // was 31 → larger again
const WALKER_BODY_H = 54; // was 60 → slightly smaller
const WALKER_FIGURE_H = 62; // was 68
const WALKER_FIGURE_W = 52; // was 56
const WALKER_FACE_TOP = 2; // 3 → 2
const FLOOR_INSET_PX = 2; // feet barely on-card (1–2px)

type SkySpark = {
  left: number; // px within card
  top: number; // px within card
  size: number;
  delay: number;
  dur: number;
};

type SkyBandPx = {
  cardW: number;
  cardH: number;
  /** First Y where lights may sit = stats bottom + 5px */
  lightTop: number;
  /** Soft ceiling before walker feet zone */
  lightBottom: number;
  statsLeft: number;
  statsRight: number;
  statsTop: number;
  statsBottom: number;
};

function hash01(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7 + SKY_LAYOUT_SALT) * 43758.5453;
  return x - Math.floor(x);
}

/** Extra gap between light icons (px). */
const LIGHT_GAP_PX = 4;
const STATS_GAP_PX = 2;

function hitsStatsAabb(
  left: number,
  top: number,
  sizePx: number,
  band: SkyBandPx,
): boolean {
  const r = sizePx / 2;
  return !(
    left + r < band.statsLeft ||
    left - r > band.statsRight ||
    top + r < band.statsTop ||
    top - r > band.statsBottom
  );
}

function sparksOverlap(
  a: { left: number; top: number; size: number },
  b: { left: number; top: number; size: number },
): boolean {
  const minDist = (a.size + b.size) / 2 + LIGHT_GAP_PX;
  const dx = a.left - b.left;
  const dy = a.top - b.top;
  return dx * dx + dy * dy < minDist * minDist;
}

/**
 * Scatter in free sky: top = stats SoftCard bottom + 5px.
 * Avoids stats AABB, no icon overlap, stays above walker feet zone.
 */
function buildSkySparks(
  lights: number,
  band: SkyBandPx | null,
): { sparks: SkySpark[]; capped: boolean } {
  const total = Math.max(0, Math.floor(lights));
  const show = Math.min(total, SKY_LIGHT_HARD_MAX);
  if (!band || band.cardW < 8 || band.cardH < 8) {
    return { sparks: [], capped: total > 0 };
  }

  const sparks: SkySpark[] = [];
  const padX = 10;
  const minX = padX;
  const maxX = band.cardW - padX;
  const minY = band.lightTop;
  const maxY = Math.max(minY + 8, band.lightBottom);
  const spanX = Math.max(8, maxX - minX);
  const spanY = Math.max(8, maxY - minY);

  for (let i = 0; i < show; i++) {
    const size =
      SKY_LIGHT_SIZES[Math.floor(hash01(i + 41) * SKY_LIGHT_SIZES.length)]!;
    let placed: SkySpark | null = null;

    for (let attempt = 0; attempt < 56; attempt++) {
      const a = hash01(i * 19 + attempt * 7 + 3);
      const b = hash01(i * 23 + attempt * 11 + 5);
      // Bias early attempts into the upper free sky just under stats.
      const yBias = attempt < 36 ? b * 0.72 : b;
      const left = minX + a * spanX;
      const top = minY + yBias * spanY;

      if (hitsStatsAabb(left, top, size, band)) continue;

      const candidate: SkySpark = {
        left,
        top,
        size,
        delay: a * 2.6,
        dur: 3.4 + b * 2.2,
      };
      if (sparks.some((s) => sparksOverlap(candidate, s))) continue;
      placed = candidate;
      break;
    }

    if (placed) sparks.push(placed);
  }

  return {
    sparks,
    capped: total > SKY_LIGHT_HARD_MAX || sparks.length < Math.min(total, show),
  };
}

const BODY_VARIANTS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;

const AVATAR_STYLES = [
  "avataaars",
  "lorelei",
  "notionists",
  "thumbs",
  "shapes",
] as const;

type Activity = "walk" | "tea" | "book" | "wave";

type WalkerState = {
  id: string;
  activity: Activity;
  x: number;
  y: number;
  vx: number;
  facing: 1 | -1;
  bobPhase: number;
  bobSpeed: number;
  pauseLeft: number;
};

/** DiceBear placeholder when the member has no stored profile photo. */
function fallbackAvatarUrl(userId: string, index: number): string {
  const style = AVATAR_STYLES[index % AVATAR_STYLES.length]!;
  const seed = encodeURIComponent(userId);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundType=gradientLinear&radius=50`;
}

/** Prefer shared `User.avatarUrl` (local avatarMap / mock); else DiceBear. */
function walkerFaceSrc(user: User, index: number): string {
  return user.avatarUrl || fallbackAvatarUrl(user.id, index);
}

function bodyUrl(index: number): string {
  const name = BODY_VARIANTS[index % BODY_VARIANTS.length]!;
  return `/group/bodies/body-${name}.png`;
}

function pickActivity(index: number): Activity {
  const cycle: Activity[] = [
    "walk",
    "tea",
    "walk",
    "book",
    "walk",
    "wave",
    "tea",
    "book",
  ];
  return cycle[index % cycle.length]!;
}

/** Aggressive lower ground band — squeezed toward card floor. */
function walkBand(height: number): { minY: number; maxY: number } {
  const maxY = Math.max(0, height - WALKER_FIGURE_H - FLOOR_INSET_PX);
  // Narrow strip near the floor (top of band also shifts down).
  const span = Math.max(10, height * 0.08);
  const minY = Math.min(maxY, Math.max(0, maxY - span));
  return { minY, maxY };
}

function seedWalkers(
  members: User[],
  width: number,
  height: number,
): WalkerState[] {
  const { minY, maxY } = walkBand(height);
  const span = Math.max(8, maxY - minY);
  return members.slice(0, 12).map((u, i) => {
    const activity = pickActivity(i);
    const baseSpeed =
      11 + (i % 5) * 2.2 + (u.id.charCodeAt(u.id.length - 1) % 5) * 0.6;
    const speed =
      activity === "tea" || activity === "book"
        ? baseSpeed * 0.35
        : activity === "wave"
          ? baseSpeed * 0.55
          : baseSpeed;
    const facing: 1 | -1 = i % 2 === 0 ? 1 : -1;
    return {
      id: u.id,
      activity,
      x: 16 + ((i * 51) % Math.max(48, width - WALKER_FIGURE_W - 8)),
      y: minY + ((i * 19) % span),
      vx: speed * facing,
      facing,
      bobPhase: (i * 0.85) % (Math.PI * 2),
      bobSpeed:
        activity === "tea"
          ? 2.6
          : activity === "book"
            ? 1.2
            : activity === "wave"
              ? 2.4
              : 1.8 + (i % 4) * 0.3,
      pauseLeft: activity === "tea" || activity === "book" ? 1.2 + (i % 3) * 0.4 : 0,
    };
  });
}

function TeaCup() {
  return (
    <span
      data-prop="tea"
      className="pointer-events-none absolute -right-1 top-[24px] z-[3] block h-[14px] w-[12px] will-change-transform"
      aria-hidden
    >
      <span className="absolute inset-x-0 bottom-0 h-[10px] rounded-[3px] rounded-b-[4px] bg-[#F4E8D8] ring-1 ring-[#D9C4A8]" />
      <span className="absolute left-[2px] top-[2px] h-[5px] w-[8px] rounded-sm bg-[#C4A574]/90" />
      <span className="absolute -right-[3px] top-[4px] h-[6px] w-[4px] rounded-full border border-[#D9C4A8]" />
    </span>
  );
}

function BookProp() {
  return (
    <span
      data-prop="book"
      className="pointer-events-none absolute left-1/2 top-[28px] z-[3] block h-[12px] w-[16px] -translate-x-1/2"
      aria-hidden
    >
      <span className="absolute inset-0 rounded-[2px] bg-[#5F8FCF] ring-1 ring-white/70" />
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/50" />
      <span className="absolute inset-x-[2px] top-[3px] h-px bg-white/40" />
      <span className="absolute inset-x-[2px] top-[6px] h-px bg-white/35" />
    </span>
  );
}

function WaveHand() {
  return (
    <span
      data-prop="wave"
      className="pointer-events-none absolute -right-0.5 top-[20px] z-[3] block h-[10px] w-[10px] origin-bottom will-change-transform"
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full bg-[#F2C9A8] ring-1 ring-white/60" />
    </span>
  );
}

/** Combined sky dashboard + cloud walkers (single card). */
export function SkyWalkers({
  members,
  memberCount,
  lights,
  rankLabel,
}: {
  members: User[];
  memberCount: number;
  lights: number;
  rankLabel: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<WalkerState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [skyBand, setSkyBand] = useState<SkyBandPx | null>(null);

  // Measure stats SoftCard bottom → lights start 5px below.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const stats = statsRef.current;
    if (!card || !stats) return;

    const measure = () => {
      const cr = card.getBoundingClientRect();
      const sr = stats.getBoundingClientRect();
      const statsTop = sr.top - cr.top;
      const statsBottom = sr.bottom - cr.top;
      const statsLeft = sr.left - cr.left;
      const statsRight = sr.right - cr.left;
      // Free sky from 5px under stats down toward walker zone (leave lower stage for feet).
      const lightTop = statsBottom + STATS_GAP_PX;
      const lightBottom = Math.min(
        cr.height * 0.58,
        cr.height - WALKER_FIGURE_H - 24,
      );
      setSkyBand({
        cardW: cr.width,
        cardH: cr.height,
        lightTop,
        lightBottom: Math.max(lightTop + 12, lightBottom),
        statsLeft,
        statsRight,
        statsTop,
        statsBottom,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(card);
    ro.observe(stats);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer || members.length === 0) return;

    stateRef.current = seedWalkers(
      members,
      stage.clientWidth,
      stage.clientHeight,
    );

    const nodes = Array.from(layer.children) as HTMLElement[];
    const paint = () => {
      stateRef.current.forEach((s, i) => {
        const el = nodes[i];
        if (!el) return;
        const bobAmp =
          s.activity === "tea" ? 1.4 : s.activity === "book" ? 0.8 : 2.2;
        const bob = Math.sin(s.bobPhase) * bobAmp;
        const figure = el.querySelector<HTMLElement>("[data-figure]");
        el.style.transform = `translate3d(${s.x}px, ${s.y + bob}px, 0)`;
        if (figure) figure.style.transform = `scaleX(${s.facing})`;

        const tea = el.querySelector<HTMLElement>('[data-prop="tea"]');
        if (tea) {
          tea.style.transform = `translateY(${Math.sin(s.bobPhase) * 1.6}px)`;
        }
        const wave = el.querySelector<HTMLElement>('[data-prop="wave"]');
        if (wave) {
          wave.style.transform = `rotate(${Math.sin(s.bobPhase) * 18}deg)`;
        }
      });
    };

    paint();

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.048, (now - last) / 1000);
      last = now;
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const { minY, maxY } = walkBand(height);

      for (const s of stateRef.current) {
        s.bobPhase += s.bobSpeed * dt;

        if (s.activity === "tea" || s.activity === "book") {
          if (s.pauseLeft > 0) {
            s.pauseLeft -= dt;
          } else {
            s.x += s.vx * dt * 0.55;
            if (Math.random() < dt * 0.15) {
              s.pauseLeft = 0.8 + Math.random() * 1.4;
            }
          }
        } else {
          s.x += s.vx * dt;
        }

        if (s.x < 4) {
          s.x = 4;
          s.vx = Math.abs(s.vx);
          s.facing = 1;
        } else if (s.x > width - WALKER_FIGURE_W - 4) {
          s.x = width - WALKER_FIGURE_W - 4;
          s.vx = -Math.abs(s.vx);
          s.facing = -1;
        }

        s.y += Math.sin(s.bobPhase * 0.3) * (s.activity === "book" ? 2 : 4) * dt;
        if (s.y < minY) s.y = minY;
        if (s.y > maxY) s.y = maxY;
      }

      paint();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [members]);

  useEffect(() => {
    if (!selectedId) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.("[data-walker-id]")) return;
      setSelectedId(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [selectedId]);

  const visible = members.slice(0, 12);
  const { sparks, capped } = useMemo(
    () => buildSkySparks(lights, skyBand),
    [lights, skyBand],
  );

  return (
    <div
      ref={cardRef}
      className="sky-group-card relative overflow-hidden rounded-[var(--radius-md)] shadow-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/group/sky-clouds-bg.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />

      {/* Sky lights — px positions from measured stats bottom + 5px */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden
      >
        {sparks.map((s, i) => (
          <span
            key={`${SKY_LAYOUT_SALT}-${i}-${s.left.toFixed(1)}-${s.top.toFixed(1)}`}
            className="sky-light-drift absolute opacity-100"
            style={{
              left: s.left,
              top: s.top,
              ["--sky-delay" as string]: `${s.delay}s`,
              ["--sky-dur" as string]: `${s.dur}s`,
            }}
          >
            <LightIcon
              active
              tone="active"
              size={s.size}
              rays={false}
              label=""
              className="drop-shadow-[0_0_1px_rgba(255,255,255,0.35)]"
            />
          </span>
        ))}
        {capped ? (
          <span
            className="absolute type-micro tracking-widest text-white/75"
            style={{
              right: 12,
              top: skyBand ? skyBand.lightTop + 8 : "48%",
            }}
          >
            …
          </span>
        ) : null}
      </div>

      <div ref={statsRef} className="relative z-10 px-4 pb-2 pt-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[var(--radius-md)] bg-white/25 px-2 py-3 backdrop-blur-[2px]">
            <StatLabel className="text-white/85">우리순은</StatLabel>
            <p className="mt-1 type-stat text-white">{memberCount}명</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white/25 px-2 py-3 backdrop-blur-[2px]">
            <StatLabel className="text-white/85">우리순 현재</StatLabel>
            <div className="mt-1 flex justify-center">
              <LightCount
                lights={lights}
                size={18}
                tone="onDark"
                textClassName="type-stat text-white"
              />
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white/25 px-2 py-3 backdrop-blur-[2px]">
            <StatLabel className="text-white/85">우리순 순위</StatLabel>
            <p className="mt-1 type-stat text-white">{rankLabel}</p>
          </div>
        </div>
      </div>

      <div
        ref={stageRef}
        className="sky-walkers-stage relative z-10 h-[210px] w-full overflow-hidden"
        aria-label="순원들이 구름 위에서 걷고 차를 마시며 책을 읽는 장면"
      >
        <div ref={layerRef} className="absolute inset-0">
          {visible.map((u, i) => {
            const selected = selectedId === u.id;
            const activity = pickActivity(i);
            return (
              <div
                key={u.id}
                data-walker-id={u.id}
                className="absolute left-0 top-0 z-[1] will-change-transform"
                style={{ width: WALKER_FIGURE_W }}
              >
                <button
                  type="button"
                  className="relative flex w-full flex-col items-center border-0 bg-transparent p-0"
                  aria-label={`${u.name}${selected ? " 선택됨" : ""}`}
                  aria-pressed={selected}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId((cur) => (cur === u.id ? null : u.id));
                  }}
                >
                  {selected ? (
                    <span className="absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-text-main px-2.5 py-1 type-micro text-white">
                      {u.name}
                    </span>
                  ) : null}

                  <div
                    data-figure
                    className="relative"
                    style={{
                      height: WALKER_FIGURE_H,
                      width: WALKER_FIGURE_W,
                    }}
                  >
                    {/* Face overlaps collar: sits low in U so shoulders cover lower face */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={walkerFaceSrc(u, i)}
                      alt=""
                      width={WALKER_FACE_PX}
                      height={WALKER_FACE_PX}
                      className="pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2 rounded-full bg-white object-cover"
                      style={{
                        top: WALKER_FACE_TOP,
                        width: WALKER_FACE_PX,
                        height: WALKER_FACE_PX,
                      }}
                      draggable={false}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bodyUrl(i)}
                      alt=""
                      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] w-full object-contain object-bottom"
                      style={{ height: WALKER_BODY_H }}
                      draggable={false}
                    />
                    {activity === "tea" ? <TeaCup /> : null}
                    {activity === "book" ? <BookProp /> : null}
                    {activity === "wave" ? <WaveHand /> : null}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LightCount, LightIcon } from "@/components/ui/LightIcon";
import { StatLabel } from "@/components/ui/StatLabel";
import { WalkerFace } from "@/components/ui/WalkerFace";
import { useApp } from "@/lib/app-context";
import { SKY_CLOUDS_BG } from "@/lib/sky-assets";

/** Four discrete sizes (~11px baseline +5%): smaller / base / larger / largest. */
const SKY_LIGHT_SIZES = [8.4, 10.5, 12.6, 14.7] as const;

/** Bump hash salt when board layout changes so sparks re-place on the new sky. */
const ME_SKY_LAYOUT_SALT = 20261111.1;

/** Same figure metrics as SkyWalkers. */
const WALKER_FACE_PX = 35;
const WALKER_BODY_H = 54;
const WALKER_FIGURE_H = 62;
const WALKER_FIGURE_W = 52;
const WALKER_FACE_TOP = 2;
const FLOOR_INSET_PX = 2;

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

type SkySpark = {
  left: number;
  top: number;
  size: number;
  delay: number;
  dur: number;
  /** Past QT with no earned light — outline stroke only. */
  outline?: boolean;
};

type SkyBandPx = {
  cardW: number;
  cardH: number;
  lightTop: number;
  lightBottom: number;
  statsLeft: number;
  statsRight: number;
  statsTop: number;
  statsBottom: number;
};

function hash01(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7 + ME_SKY_LAYOUT_SALT) * 43758.5453;
  return x - Math.floor(x);
}

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

/** Scatter earned + outline lights in free sky under the stats tiles. */
function buildMeSkySparks(
  lights: number,
  outlineLights: number,
  band: SkyBandPx | null,
): { sparks: SkySpark[]; capped: boolean } {
  const filled = Math.max(0, Math.floor(lights));
  const outlines = Math.max(0, Math.floor(outlineLights));
  const show = filled + outlines;
  if (!band || band.cardW < 8 || band.cardH < 8) {
    return { sparks: [], capped: false };
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
    const outline = i >= filled;
    const size =
      SKY_LIGHT_SIZES[Math.floor(hash01(i + 41) * SKY_LIGHT_SIZES.length)]!;
    let placed: SkySpark | null = null;

    for (let attempt = 0; attempt < 56; attempt++) {
      const a = hash01(i * 19 + attempt * 7 + 3);
      const b = hash01(i * 23 + attempt * 11 + 5);
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
        outline,
      };
      if (sparks.some((s) => sparksOverlap(candidate, s))) continue;
      placed = candidate;
      break;
    }

    if (placed) sparks.push(placed);
  }

  return {
    sparks,
    capped: sparks.length < show,
  };
}

function bodyUrlFor(userId: string): string {
  const n = userId.charCodeAt(userId.length - 1) % BODY_VARIANTS.length;
  return `/group/bodies/body-${BODY_VARIANTS[n]!}.png`;
}

function walkBand(height: number): { minY: number; maxY: number } {
  const maxY = Math.max(0, height - WALKER_FIGURE_H - FLOOR_INSET_PX);
  const span = Math.max(10, height * 0.08);
  const minY = Math.min(maxY, Math.max(0, maxY - span));
  return { minY, maxY };
}

/**
 * Mypage sky banner: cloud photo + year-light sparks + solo jumping walker.
 * Profile row navigates to account settings.
 */
export function MeSky({
  monthLights,
  yearLights,
  /** Past-date QT outline sparks (not counted in month/year dashboards). */
  outlineLights = 0,
  cumulativeLabel,
  groupLabel,
}: {
  monthLights: number;
  yearLights: number;
  outlineLights?: number;
  /** e.g. 「14기 누적」 */
  cumulativeLabel: string;
  groupLabel: string;
}) {
  const { currentUser } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const walkerRef = useRef<HTMLDivElement>(null);
  const [skyBand, setSkyBand] = useState<SkyBandPx | null>(null);

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
      const lightTop = statsBottom + STATS_GAP_PX;
      // Leave lower stage for the solo walker feet zone.
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

  // Solo walker: current user only — hop/jump + gentle stroll.
  useEffect(() => {
    const stage = stageRef.current;
    const el = walkerRef.current;
    if (!stage || !el || !currentUser) return;

    const { minY, maxY } = walkBand(stage.clientHeight);
    const state = {
      x: Math.max(8, (stage.clientWidth - WALKER_FIGURE_W) / 2),
      y: (minY + maxY) / 2,
      vx: 14,
      facing: 1 as 1 | -1,
      phase: 0,
    };

    const paint = () => {
      // Jump: abs(sin) lifts off the ground (stronger than group bob).
      const jump = -Math.abs(Math.sin(state.phase)) * 10;
      el.style.transform = `translate3d(${state.x}px, ${state.y + jump}px, 0)`;
      // Face stays front-facing; only body flips with walk direction.
      const body = el.querySelector<HTMLElement>("[data-facing]");
      if (body) body.style.transform = `scaleX(${state.facing})`;
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
      const band = walkBand(height);

      state.phase += 5.2 * dt;
      state.x += state.vx * dt;

      if (state.x < 8) {
        state.x = 8;
        state.vx = Math.abs(state.vx);
        state.facing = 1;
      } else if (state.x > width - WALKER_FIGURE_W - 8) {
        state.x = width - WALKER_FIGURE_W - 8;
        state.vx = -Math.abs(state.vx);
        state.facing = -1;
      }

      state.y += Math.sin(state.phase * 0.25) * 3 * dt;
      if (state.y < band.minY) state.y = band.minY;
      if (state.y > band.maxY) state.y = band.maxY;

      paint();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentUser]);

  const { sparks, capped } = useMemo(
    () => buildMeSkySparks(yearLights, outlineLights, skyBand),
    [yearLights, outlineLights, skyBand],
  );

  if (!currentUser) return null;

  const avatar = currentUser.avatarUrl ?? null;
  const bodySrc = bodyUrlFor(currentUser.id);

  return (
    <div ref={cardRef} className="sky-group-card me-sky-card relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SKY_CLOUDS_BG}
        alt=""
        className="sky-clouds-bg pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden
      >
        {sparks.map((s, i) => (
          <span
            key={`${ME_SKY_LAYOUT_SALT}-${i}-${s.left.toFixed(1)}-${s.top.toFixed(1)}`}
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
              outline={Boolean(s.outline)}
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

      <div ref={statsRef} className="relative z-20 px-4 pb-3 pt-3">
        <Link
          href="/me/settings"
          className="mb-3 flex items-center gap-3 rounded-[8px] bg-white/50 px-3 py-2.5 shadow-[0_1px_4px_rgba(0,9,23,0.18)] backdrop-blur-[2px]"
          aria-label="계정 설정"
        >
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-light type-stat text-[var(--color-ink-blue)]">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              currentUser.name.slice(0, 1)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate type-stat text-[var(--color-ink-blue)]">
              {currentUser.name}
            </p>
            <p className="type-body-sm text-[var(--color-ink-blue)] opacity-75">
              {groupLabel}
            </p>
          </div>
          <ChevronRight
            size={18}
            className="shrink-0 text-[var(--color-ink-blue)] opacity-60"
            strokeWidth={1.75}
          />
        </Link>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="sky-stat-tile bg-white/50 px-2 py-3 shadow-[0_1px_4px_rgba(0,9,23,0.18)] backdrop-blur-[2px]">
            <StatLabel className="text-[var(--color-ink-blue)]">
              이번달 내가 모은 빛
            </StatLabel>
            <div className="mt-1 flex justify-center">
              <LightCount
                lights={monthLights}
                size={18}
                rays={false}
                textClassName="type-stat text-[var(--color-black)]"
              />
            </div>
          </div>
          <div className="sky-stat-tile bg-white/50 px-2 py-3 shadow-[0_1px_4px_rgba(0,9,23,0.18)] backdrop-blur-[2px]">
            <StatLabel className="text-[var(--color-ink-blue)]">
              {cumulativeLabel}
            </StatLabel>
            <div className="mt-1 flex justify-center">
              <LightCount
                lights={yearLights}
                size={18}
                textClassName="type-stat text-[var(--color-black)]"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={stageRef}
        className="me-sky-stage sky-walkers-stage relative z-10 w-full overflow-hidden"
        aria-label={`${currentUser.name}이(가) 구름 위에서 뛰고 있어요`}
      >
        <div
          ref={walkerRef}
          className="absolute left-0 top-0 z-[1] will-change-transform"
          style={{ width: WALKER_FIGURE_W }}
          data-walker-id={currentUser.id}
        >
          <div
            data-figure
            className="relative"
            style={{
              height: WALKER_FIGURE_H,
              width: WALKER_FIGURE_W,
            }}
          >
            <WalkerFace
              user={currentUser}
              size={WALKER_FACE_PX}
              style={{ top: WALKER_FACE_TOP }}
            />
            <div
              data-facing
              className="absolute inset-0 will-change-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bodySrc}
                alt=""
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] w-full object-contain object-bottom"
                style={{ height: WALKER_BODY_H }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

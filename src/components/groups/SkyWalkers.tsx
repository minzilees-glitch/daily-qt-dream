"use client";

import { useEffect, useRef, useState } from "react";
import { MonthPicker } from "@/components/ui/MonthPicker";
import type { User } from "@/types";

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

function avatarUrl(userId: string, index: number): string {
  const style = AVATAR_STYLES[index % AVATAR_STYLES.length]!;
  const seed = encodeURIComponent(userId);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundType=gradientLinear&radius=50`;
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

function seedWalkers(
  members: User[],
  width: number,
  height: number,
): WalkerState[] {
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
      x: 16 + ((i * 51) % Math.max(48, width - 64)),
      y: Math.max(8, height * 0.2) + ((i * 19) % Math.max(24, height * 0.42)),
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
      className="pointer-events-none absolute -right-1 top-[28px] z-[3] block h-[14px] w-[12px] will-change-transform"
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
      className="pointer-events-none absolute left-1/2 top-[32px] z-[3] block h-[12px] w-[16px] -translate-x-1/2"
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
      className="pointer-events-none absolute -right-0.5 top-[24px] z-[3] block h-[10px] w-[10px] origin-bottom will-change-transform"
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full bg-[#F2C9A8] ring-1 ring-white/60" />
    </span>
  );
}

/** Combined sky dashboard + cloud walkers (single card). */
export function SkyWalkers({
  members,
  yearMonth,
  onYearMonthChange,
  minYearMonth,
  maxYearMonth,
  memberCount,
  rateLabel,
  rankLabel,
}: {
  members: User[];
  yearMonth: string;
  onYearMonthChange: (ym: string) => void;
  minYearMonth: string;
  maxYearMonth: string;
  memberCount: number;
  rateLabel: string;
  rankLabel: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<WalkerState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      const figureW = 56;
      const figureH = 72;

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
        } else if (s.x > width - figureW - 4) {
          s.x = width - figureW - 4;
          s.vx = -Math.abs(s.vx);
          s.facing = -1;
        }

        s.y += Math.sin(s.bobPhase * 0.3) * (s.activity === "book" ? 2 : 4) * dt;
        const minY = height * 0.16;
        const maxY = Math.max(minY, height - figureH - 4);
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

  return (
    <div className="sky-group-card relative overflow-hidden rounded-[24px] shadow-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/group/sky-clouds-bg.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />

      <div className="relative z-10 px-4 pb-2 pt-4">
        <MonthPicker
          value={yearMonth}
          onChange={onYearMonthChange}
          min={minYearMonth}
          max={maxYearMonth}
          light
        />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[18px] bg-white/25 px-2 py-3 backdrop-blur-[2px]">
            <p className="text-[11px] text-white/85">인원</p>
            <p className="mt-1 text-lg font-semibold text-white">{memberCount}명</p>
          </div>
          <div className="rounded-[18px] bg-white/25 px-2 py-3 backdrop-blur-[2px]">
            <p className="text-[11px] text-white/85">참여율</p>
            <p className="mt-1 text-lg font-semibold text-white">{rateLabel}</p>
          </div>
          <div className="rounded-[18px] bg-white/25 px-2 py-3 backdrop-blur-[2px]">
            <p className="text-[11px] text-white/85">전체 순위</p>
            <p className="mt-1 text-lg font-semibold text-white">{rankLabel}</p>
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
                style={{ width: 56 }}
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
                    <span className="absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#243746] px-2.5 py-1 text-[11px] font-medium text-white">
                      {u.name}
                    </span>
                  ) : null}

                  <div data-figure className="relative h-[68px] w-[56px]">
                    {/* Face overlaps collar: sits low in U so shoulders cover lower face */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl(u.id, i)}
                      alt=""
                      width={28}
                      height={28}
                      className="pointer-events-none absolute left-1/2 top-[14px] z-[1] h-[28px] w-[28px] -translate-x-1/2 rounded-full bg-white object-cover"
                      draggable={false}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bodyUrl(i)}
                      alt=""
                      className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[60px] w-full object-contain object-bottom"
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

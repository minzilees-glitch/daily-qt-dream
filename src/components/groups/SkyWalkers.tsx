"use client";

import { useEffect, useRef } from "react";
import type { User } from "@/types";

const BODY_TONES = [
  "#7EB6E8",
  "#8FC7A3",
  "#E8B07A",
  "#C9A0DC",
  "#7CC4C0",
  "#E89A9A",
  "#A8B8E0",
  "#D4C07A",
];

type WalkerState = {
  id: string;
  x: number;
  y: number;
  vx: number;
  facing: 1 | -1;
  bobPhase: number;
  bobSpeed: number;
};

function seedWalkers(
  members: User[],
  width: number,
  height: number,
): WalkerState[] {
  return members.slice(0, 12).map((u, i) => {
    const speed = 14 + (i % 5) * 3.5 + (u.id.charCodeAt(u.id.length - 1) % 6);
    const facing: 1 | -1 = i % 2 === 0 ? 1 : -1;
    return {
      id: u.id,
      x: 20 + ((i * 51) % Math.max(48, width - 52)),
      y: 40 + ((i * 29) % Math.max(36, height - 96)),
      vx: speed * facing,
      facing,
      bobPhase: (i * 0.85) % (Math.PI * 2),
      bobSpeed: 2.1 + (i % 4) * 0.4,
    };
  });
}

/** Soft heaven-above-clouds scene with wandering group-member figures. */
export function SkyWalkers({ members }: { members: User[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<WalkerState[]>([]);

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
        const bob = Math.sin(s.bobPhase) * 2.5;
        const body = el.querySelector<HTMLElement>("[data-body]");
        el.style.transform = `translate3d(${s.x}px, ${s.y + bob}px, 0)`;
        if (body) body.style.transform = `scaleX(${s.facing})`;
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
      const figureW = 40;
      const figureH = 70;

      for (const s of stateRef.current) {
        s.x += s.vx * dt;
        s.bobPhase += s.bobSpeed * dt;

        if (s.x < 6) {
          s.x = 6;
          s.vx = Math.abs(s.vx);
          s.facing = 1;
        } else if (s.x > width - figureW - 6) {
          s.x = width - figureW - 6;
          s.vx = -Math.abs(s.vx);
          s.facing = -1;
        }

        s.y += Math.sin(s.bobPhase * 0.32) * 5 * dt;
        const minY = 24;
        const maxY = Math.max(minY, height - figureH - 8);
        if (s.y < minY) s.y = minY;
        if (s.y > maxY) s.y = maxY;
      }

      paint();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [members]);

  if (members.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-[24px] bg-sky-light px-4 text-sm text-text-secondary">
        아직 순원이 없습니다.
      </div>
    );
  }

  const visible = members.slice(0, 12);

  return (
    <div className="overflow-hidden rounded-[24px] bg-white">
      <div className="relative z-10 px-4 pb-2 pt-4">
        <h2 className="text-[16px] font-semibold tracking-tight text-text-main">
          하늘나라 구름 위
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          우리 순이 구름 위를 함께 걸어가요.
        </p>
      </div>

      <div
        ref={stageRef}
        className="sky-walkers-stage relative h-[230px] w-full overflow-hidden"
        aria-label="순원들이 구름 위를 걷는 장면"
      >
        <div className="sky-walkers-clouds pointer-events-none absolute inset-0" />
        <div ref={layerRef} className="absolute inset-0">
          {visible.map((u, i) => {
            const tone = BODY_TONES[i % BODY_TONES.length]!;
            return (
              <div
                key={u.id}
                className="absolute left-0 top-0 will-change-transform"
                style={{ width: 40 }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                    style={{ background: tone }}
                    aria-hidden
                  >
                    {u.name.slice(0, 1)}
                  </div>
                  <div data-body className="flex flex-col items-center">
                    <div
                      className="mt-0.5 h-[18px] w-5 rounded-[7px]"
                      style={{ background: tone }}
                    />
                    <div className="mt-0.5 flex gap-[3px]">
                      <span
                        className="block h-3 w-[5px] rounded-full"
                        style={{ background: tone }}
                      />
                      <span
                        className="block h-3 w-[5px] rounded-full"
                        style={{ background: tone }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

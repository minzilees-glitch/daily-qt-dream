"use client";

import { useRef } from "react";

export function DayParticipation({
  days,
}: {
  days: { date: string; count: number; total: number }[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startScroll: number;
    moved: boolean;
  }>({ active: false, startX: 0, startScroll: 0, moved: false });

  if (days.length === 0) {
    return (
      <p className="py-6 text-center type-body-sm text-text-secondary">
        이번 달 참여 데이터가 아직 없습니다.
      </p>
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 2) drag.moved = true;
    el.scrollLeft = drag.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    drag.active = false;
    el.style.cursor = "grab";
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={scrollerRef}
      className="flex cursor-grab gap-2 overflow-x-auto pb-1 scrollbar-none active:cursor-grabbing touch-pan-x select-none"
      style={{ WebkitOverflowScrolling: "touch" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={(e) => {
        if (dragRef.current.active) endDrag(e);
      }}
    >
      {days.map((d) => {
        const ratio = d.total === 0 ? 0 : d.count / d.total;
        const dayNum = Number(d.date.slice(8));
        return (
          <div
            key={d.date}
            className="flex w-11 shrink-0 snap-start flex-col items-center gap-1.5"
            title={`${d.date}: ${d.count}/${d.total}`}
          >
            {/* Track: light sky tint · Fill: sky · Labels: black */}
            <div className="flex h-16 w-8 items-end overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-sky)_32%,white)]">
              <div
                className="w-full rounded-full bg-[var(--color-sky)] transition-all"
                style={{ height: `${Math.max(8, ratio * 100)}%` }}
              />
            </div>
            <span className="type-label text-[var(--color-black)]">{dayNum}</span>
          </div>
        );
      })}
    </div>
  );
}

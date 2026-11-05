"use client";

import { StatLabel } from "@/components/ui/StatLabel";
import { LightIcon } from "@/components/ui/LightIcon";

type Day = {
  weekday: number;
  label: string;
  count: number;
  possible: number;
};

/** Vessel 빛 size; adjacent icons may overlap by up to 20%. */
const VESSEL_LIGHT_SIZE = 14;
const VESSEL_LIGHT_OVERLAP = Math.round(VESSEL_LIGHT_SIZE * 0.2);

function GlassLightVessel({
  count,
  possible,
  label,
}: {
  count: number;
  possible: number;
  label: string;
}) {
  const empty = count === 0;
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      title={`${label}: ${count}${possible ? `/${possible}` : ""}`}
    >
      <div
        className="week-glass-vessel relative flex w-9 flex-col-reverse items-center overflow-hidden px-1 pb-1.5 pt-2"
        style={{ height: "7.25rem" }}
        aria-hidden={empty}
      >
        {/* Specular rim */}
        <span className="week-glass-vessel-sheen pointer-events-none absolute inset-0" />
        {empty ? null : (
          <div
            className="relative z-[1] flex w-full flex-col-reverse items-center pb-0.5"
            style={{ gap: `-${VESSEL_LIGHT_OVERLAP}px` }}
          >
            {Array.from({ length: count }, (_, i) => (
              <LightIcon
                key={i}
                active
                size={VESSEL_LIGHT_SIZE}
                rays={false}
                label=""
                className="shadow-none"
              />
            ))}
          </div>
        )}
      </div>
      <StatLabel as="span" className="text-text-secondary">
        {label}
      </StatLabel>
    </div>
  );
}

function BarColumn({
  day,
  max,
  showCount,
  showPossible,
}: {
  day: Day;
  max: number;
  showCount: boolean;
  showPossible: boolean;
}) {
  const ratio = day.count / max;
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      title={`${day.label}: ${day.count}/${day.possible}`}
    >
      {showCount ? (
        <p className="type-label font-semibold tabular-nums text-text-main">
          {day.count}
        </p>
      ) : (
        <span className="h-0 w-full" aria-hidden />
      )}
      <div className="flex h-16 w-8 items-end overflow-hidden rounded-full bg-sky-light">
        <div
          className="w-full rounded-full bg-sky transition-all"
          style={{
            height:
              day.possible === 0 && day.count === 0
                ? "10%"
                : `${Math.max(10, ratio * 100)}%`,
            opacity: day.possible === 0 && day.count === 0 ? 0.35 : 1,
          }}
        />
      </div>
      <StatLabel as="span" className="text-text-secondary">
        {day.label}
      </StatLabel>
      {showPossible ? (
        <span className="type-nav tabular-nums text-text-secondary/80">
          /{day.possible}
        </span>
      ) : null}
    </div>
  );
}

export function WeekdayParticipation({
  days,
  showPossible = true,
  /** Count above each bar. Default true; 우리순 이번주 chart hides it. */
  showCount = true,
  /** `glass` = transparent vessels with stacked 빛 orbs (1 orb = 1 count). */
  variant = "bar",
}: {
  days: Day[];
  showPossible?: boolean;
  showCount?: boolean;
  variant?: "bar" | "glass";
}) {
  if (days.length === 0 || days.every((d) => d.possible === 0 && d.count === 0)) {
    return (
      <p className="py-6 text-center type-body-sm text-text-secondary">
        이번 주 참여 데이터가 아직 없습니다.
      </p>
    );
  }

  const max = Math.max(...days.map((d) => d.count), 1);

  if (variant === "glass") {
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <GlassLightVessel
            key={d.weekday}
            count={d.count}
            possible={d.possible}
            label={d.label}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => (
        <BarColumn
          key={d.weekday}
          day={d}
          max={max}
          showCount={showCount}
          showPossible={showPossible}
        />
      ))}
    </div>
  );
}

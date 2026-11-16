"use client";

import type { ReactNode } from "react";

/**
 * Home shell: sky header + overlapping mint QT sheet (no grabber).
 * 「오늘의 말씀」 lives at the sheet top — same mint wash as the pad above it.
 */
export function HomePremiumShell({
  header,
  sheet,
}: {
  header: ReactNode;
  sheet: ReactNode;
}) {
  return (
    <div className="premium-qt-root premium-home-root premium-home-shell premium-home-shell--short">
      <div className="premium-home-top">
        <div className="premium-home-header-band">{header}</div>
      </div>

      <section className="premium-qt-sheet premium-home-form-sheet">
        {sheet}
      </section>
    </div>
  );
}

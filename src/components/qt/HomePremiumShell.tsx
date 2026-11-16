"use client";

import type { ReactNode } from "react";

/**
 * Home shell: sky header + overlapping mint QT sheet.
 * 「오늘의 말씀」 lives inside the sheet (no separate passage window).
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
        <div className="premium-sheet-grabber-row" aria-hidden>
          <span className="premium-sheet-grabber" />
        </div>
        {sheet}
      </section>
    </div>
  );
}

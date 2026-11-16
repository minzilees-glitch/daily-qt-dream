"use client";

import type { ReactNode } from "react";

/**
 * Home shell: shared sky→white gradient + flat QT content (no drawer chrome).
 * 「오늘의 말씀」 Duranno card sits at the top of the form block.
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

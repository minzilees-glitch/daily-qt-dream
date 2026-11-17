import { HomeClient } from "./HomeClient";

/**
 * Instant soft-nav shell — no `connection()` / Duranno scrape on the RSC path.
 * Verse range loads client-side via `/api/duranno/today`.
 */
export default function HomePage() {
  return <HomeClient />;
}

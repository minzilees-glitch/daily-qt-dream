import { HomeClient } from "./HomeClient";

/**
 * Instant soft-nav shell.
 * Verse range comes from uploaded `history-passages` (same as 나의 큐티들).
 * 「말씀보기」 still opens Duranno in the system browser.
 */
export default function HomePage() {
  return <HomeClient />;
}

# Design preferences

## 낮모드 / 밤모드 (sky chrome)

- Time zone: **Asia/Seoul**
- **낮모드** (그 외 시간): headers (홈·나의 QT들 캘린더·우리순·랭킹·마이페이지) + MeSky + SkyWalkers solid fill = `--color-sky` (`#6DC2FF`) via `--sky-mode-fill`
- **밤모드** (19:00–06:00, 19:00 포함 · 06:00 제외): 같은 surfaces = `--color-black` (`#000917`)
- Cloud photo on MeSky / SkyWalkers stays; only the solid fill / header / sheet-ear seam swap
- Implementation: `html[data-sky-mode="낮모드"|"밤모드"]` → CSS `--sky-mode-fill` / `--sky-mode-ink` (`src/lib/sky-mode.ts`, `SkyModeSync`)
- 홈 헤더: `.premium-home-header-band` uses the same `--sky-mode-fill` / `--sky-mode-ink` tokens
- 나의 QT들 캘린더: `.premium-qt-header` + `--premium-cal-bg` → `--sky-mode-fill` (not hardcoded black)

# Design preferences

## 낮모드 / 밤모드 (sky chrome)

- Time zone: **Asia/Seoul**
- **낮모드** (그 외 시간): headers + MeSky + SkyWalkers fill = `--color-sky` (`#6DC2FF`) via `--sky-mode-fill`; **header copy = `--color-black`** via `--sky-mode-ink`
- **밤모드** (19:00–06:00, 19:00 포함 · 06:00 제외): fill = `--color-black` (`#000917`); **header copy = white/light** (`--color-white`) for contrast
- Cloud photo on MeSky / SkyWalkers stays; only the solid fill / header / sheet-ear seam swap
- Implementation: `html[data-sky-mode="낮모드"|"밤모드"]` → CSS `--sky-mode-fill` / `--sky-mode-ink` (`src/lib/sky-mode.ts`, `SkyModeSync`)
- 홈 / 나의 QT들 / 우리순 / 랭킹 / 마이페이지 headers all use `--sky-mode-ink`

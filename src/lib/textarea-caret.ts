/**
 * Custom caret height vs CSS font-size — closer to a normal text caret than
 * 1em, but well below notebook line-height so wrap does not enlarge it.
 */
export const QT_LINED_CARET_EM = 1.3;

/** Height for `.qt-lined-caret`, clamped under the line box. */
export function linedCaretHeight(fontSize: number, lineHeight: number): number {
  const target = fontSize * QT_LINED_CARET_EM;
  // Stay clearly below the notebook line box (native caret used the full box).
  const max = lineHeight * 0.72;
  return Math.min(target, max);
}

/**
 * Vertical translate for `.qt-lined-caret`.
 *
 * `contentTop` is the mirror marker's offsetTop — the inline **content-box**
 * top after half-leading, not the line-box top. Center the caret in that
 * content box so it lines up with Hangul/Latin glyphs (centering in the full
 * line-height on top of offsetTop double-counts half-leading and sits low).
 */
export function linedCaretY(
  contentTop: number,
  contentHeight: number,
  caretHeight: number,
): number {
  return contentTop + (contentHeight - caretHeight) / 2;
}

/**
 * Mirror-div caret metrics for a <textarea>.
 * Returns content-box top/left (after half-leading) plus fontSize / lineHeight
 * / contentHeight so callers can draw a stable caret centered on the glyphs.
 *
 * The marker span must stay **one line** (one char or ZWSP). Putting the entire
 * remainder in the span makes `offsetHeight` grow with trailing lines, so
 * linedCaretY drops the caret between rows when the selection is on an earlier
 * line.
 */
export function getTextareaCaretMetrics(
  el: HTMLTextAreaElement,
  position: number,
): {
  top: number;
  left: number;
  fontSize: number;
  lineHeight: number;
  contentHeight: number;
} {
  const style = getComputedStyle(el);
  const div = document.createElement("div");
  const span = document.createElement("span");

  const copy = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "whiteSpace",
    "wordBreak",
    "overflowWrap",
    "direction",
  ] as const;

  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.top = "0";
  div.style.left = "-9999px";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.overflowWrap = "break-word";

  for (const prop of copy) {
    div.style[prop] = style[prop];
  }

  // Match textarea content box width (clientWidth includes padding).
  div.style.width = `${el.clientWidth}px`;
  div.style.height = "auto";
  div.style.border = "0";
  div.style.padding = style.padding;

  const value = el.value;
  div.textContent = value.slice(0, position);
  // Single-line marker only — never the full remainder (multi-line offsetHeight
  // would shove linedCaretY between notebook rows).
  const ch = value.charAt(position);
  span.textContent = ch && ch !== "\n" ? ch : "\u200b";
  div.appendChild(span);
  if (ch) {
    div.appendChild(document.createTextNode(value.slice(position + (ch === "\n" ? 0 : 1))));
  }
  document.body.appendChild(div);

  const fontSize = Number.parseFloat(style.fontSize) || 17;
  const lineHeightRaw = style.lineHeight;
  const lineHeight =
    lineHeightRaw === "normal"
      ? fontSize * 1.2
      : Number.parseFloat(lineHeightRaw) || fontSize * 1.2;

  // offsetTop describes the inline content box (after half-leading), not the
  // full line box — see linedCaretY. Prefer the marker's content height; if a
  // browser reports the line box (or anything taller), fall back to fontSize
  // so we do not double-count half-leading.
  const top = span.offsetTop - el.scrollTop + el.clientTop;
  const left = span.offsetLeft - el.scrollLeft + el.clientLeft;
  const measured = span.offsetHeight || fontSize;
  // Multi-line or full line-box heights (≥ ~0.85×line) must not drive Y.
  const contentHeight =
    measured >= lineHeight * 0.85 ? fontSize : measured;

  document.body.removeChild(div);

  return { top, left, fontSize, lineHeight, contentHeight };
}

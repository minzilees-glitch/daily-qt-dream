/**
 * Mirror-div caret metrics for a <textarea>.
 * Returns line-box top/left (content coords) plus fontSize / lineHeight
 * so callers can draw a font-sized caret centered in a tall notebook line.
 */
export function getTextareaCaretMetrics(
  el: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; fontSize: number; lineHeight: number } {
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
  span.textContent = value.slice(position) || "\u200b";
  div.appendChild(span);
  document.body.appendChild(div);

  const fontSize = Number.parseFloat(style.fontSize) || 17;
  const lineHeightRaw = style.lineHeight;
  const lineHeight =
    lineHeightRaw === "normal"
      ? fontSize * 1.2
      : Number.parseFloat(lineHeightRaw) || fontSize * 1.2;

  const top = span.offsetTop - el.scrollTop + el.clientTop;
  const left = span.offsetLeft - el.scrollLeft + el.clientLeft;

  document.body.removeChild(div);

  return { top, left, fontSize, lineHeight };
}

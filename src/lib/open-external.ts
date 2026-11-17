/**
 * Open an absolute http(s) URL in the system browser / a new browser tab.
 * Never navigates the current document (no location.assign) — the QT app
 * page must stay put when 「말씀보기」 opens Duranno.
 */
export function openInSystemBrowser(url: string): void {
  const href = url.trim();
  if (!href || typeof window === "undefined") return;

  // Programmatic <a target=_blank> click: reliable external open without
  // replacing the current page (unlike location.assign / same-tab href).
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

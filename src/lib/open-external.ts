/**
 * Open an absolute http(s) URL in the system browser / a new browser tab.
 * Prefer this over in-app same-document navigation for third-party pages
 * (e.g. Duranno 「말씀보기」).
 */
export function openInSystemBrowser(url: string): void {
  const href = url.trim();
  if (!href || typeof window === "undefined") return;

  // Cross-origin _blank should leave PWA / in-app shells for Safari/Chrome.
  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (opened) {
    try {
      opened.opener = null;
    } catch {
      // Ignore cross-origin opener assignment failures.
    }
    return;
  }

  // Popup blocked: top-level assign still leaves the app shell for that URL.
  window.location.assign(href);
}

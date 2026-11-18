"use client";

const KEY = "sowhat_theme";

/**
 * Light/dark switch for the home page. The theme lives on <html data-theme>,
 * set before paint by the script in layout.tsx; CSS picks the icon from it,
 * so this needs no React state. The choice is kept in localStorage.
 */
export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme !== "dark";
    if (dark) root.dataset.theme = "dark";
    else delete root.dataset.theme;
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      // Private browsing: the switch still works for this visit.
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Light or dark"
      className="fixed right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--home-field-border)] bg-[var(--home-field)] text-[var(--home-ink-2)] transition hover:text-[var(--home-ink)]"
    >
      <svg className="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
      </svg>
      <svg className="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}

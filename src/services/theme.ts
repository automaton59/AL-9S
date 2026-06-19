import type { ThemeMode } from './interfaces';

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

function prefersDarkTheme() {
  return window.matchMedia(SYSTEM_DARK_QUERY).matches;
}

export function resolveTheme(themeMode: ThemeMode) {
  return themeMode === 'dark' || (themeMode === 'system' && prefersDarkTheme())
    ? 'dark'
    : 'light';
}

export function applyThemeMode(themeMode: ThemeMode) {
  if (typeof window === 'undefined') {
    return;
  }

  const resolvedTheme = resolveTheme(themeMode);
  const shouldUseDark = resolvedTheme === 'dark';
  const root = document.documentElement;

  root.classList.toggle('dark', shouldUseDark);
  root.classList.toggle('light', !shouldUseDark);
  root.dataset.themeMode = themeMode;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  document.body?.classList.toggle('dark', shouldUseDark);
  document.body?.classList.toggle('light', !shouldUseDark);

  void window.electron?.theme?.setSource(themeMode);
}

export function watchSystemTheme(themeMode: ThemeMode, onChange: () => void) {
  if (typeof window === 'undefined' || themeMode !== 'system') {
    return undefined;
  }

  const media = window.matchMedia(SYSTEM_DARK_QUERY);
  media.addEventListener('change', onChange);

  return () => media.removeEventListener('change', onChange);
}

'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { Tooltip } from '@/components/ui/tooltip';
import { ThemeCookie, type ThemeChoice } from '@/lib/theme';
import { cn } from '@/utils/cn';

const OneYear = 60 * 60 * 24 * 365;
const DarkQuery = '(prefers-color-scheme: dark)';

type ThemeState = { choice: ThemeChoice; dark: boolean; choose: (next: ThemeChoice) => void };

const ThemeContext = createContext<ThemeState | null>(null);

function useTheme(): ThemeState {
  const state = use(ThemeContext);
  if (!state) throw new Error('useTheme outside ThemeProvider');
  return state;
}

/**
 * Holds the theme for the portal's chrome. Applying a choice is instant — the
 * attribute on <html> is all the CSS reads — and the cookie makes the next page
 * load render the same way from the server.
 */
export function ThemeProvider({ initial, children }: { initial: ThemeChoice; children: ReactNode }): React.JSX.Element {
  const [choice, setChoice] = useState<ThemeChoice>(initial);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(DarkQuery);
    const update = (): void => setSystemDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const choose = useCallback((next: ThemeChoice) => {
    setChoice(next);
    const root = document.documentElement;
    if (next === 'system') {
      delete root.dataset.theme;
      document.cookie = `${ThemeCookie}=; path=/; max-age=0; samesite=lax`;
    } else {
      root.dataset.theme = next;
      document.cookie = `${ThemeCookie}=${next}; path=/; max-age=${OneYear}; samesite=lax`;
    }
  }, []);

  const value = useMemo(
    () => ({ choice, dark: choice === 'dark' || (choice === 'system' && systemDark), choose }),
    [choice, systemDark, choose],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/** The top bar's one-tap switch between light and dark. */
export function ThemeToggle(): React.JSX.Element {
  const { dark, choose } = useTheme();
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={() => choose(dark ? 'light' : 'dark')}
        aria-label={label}
        className="rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
      >
        {dark ? <Sun className="size-4" strokeWidth={1.9} /> : <Moon className="size-4" strokeWidth={1.9} />}
      </button>
    </Tooltip>
  );
}

const Options: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/** Light, dark, or follow the system — in the account menu. */
export function ThemeChooser(): React.JSX.Element {
  const { choice, choose } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-md bg-surface-sunken p-1">
      {Options.map((option) => {
        const active = choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(option.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[12px] font-medium transition-colors',
              active ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(11,21,36,0.12)]' : 'text-ink-muted hover:text-ink',
            )}
          >
            <option.icon className="size-3.5" strokeWidth={1.9} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

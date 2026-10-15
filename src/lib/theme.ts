/**
 * The portal's colour theme. "system" follows the operating system and is the
 * default; "light" and "dark" are an explicit choice.
 *
 * Kept in an ordinary cookie, readable by the page, because it is a display
 * preference and nothing else: the root layout reads it to render the right
 * theme on the first paint, and the switcher writes it without a server call.
 */
export const ThemeCookie = 'risips_admin_theme';

export const ThemeChoices = ['system', 'light', 'dark'] as const;
export type ThemeChoice = (typeof ThemeChoices)[number];

export function parseTheme(value: string | undefined): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system';
}

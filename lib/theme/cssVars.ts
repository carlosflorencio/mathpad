/**
 * Centralized CSS variable definitions for dark and light themes.
 * Used by both the layout init script (to prevent flash) and App.tsx (for runtime updates).
 */

export const darkCssVars = {
  "--text-color": "hsl(95, 6.7%, 64.7%)",
  "--text-muted": "rgba(214,221,209,0.7)",
  "--desk-bg-color": "hsl(216, 13.2%, 14.9%)",
  "--cm-background": "hsl(220, 13%, 18%)",
  "--ui-border-color": "rgba(255,255,255,0.1)",
  "--bg-modal": "rgba(33,34,38,0.95)",
  "--bg-dropdown": "rgba(33,34,38,0.8)",
  "--bg-input": "rgba(255,255,255,0.05)",
  "--bg-button-hover": "rgba(255,255,255,0.1)",
  "--bg-menu-item-hover": "rgba(122,122,122,0.1)",
  "--paper-shadow": "var(--paper-shadow-dark)",
} as const

export const lightCssVars = {
  "--text-color": "hsl(0, 0%, 40%)",
  "--text-muted": "rgba(0,0,0,0.5)",
  "--desk-bg-color": "#f8f9fa",
  "--cm-background": "hsl(0, 0%, 100%)",
  "--ui-border-color": "rgba(0,0,0,0.1)",
  "--bg-modal": "rgba(255,255,255,0.95)",
  "--bg-dropdown": "rgba(255,255,255,0.8)",
  "--bg-input": "rgba(255,255,255,1)",
  "--bg-button-hover": "rgba(0,0,0,0.05)",
  "--bg-menu-item-hover": "rgba(122,122,122,0.1)",
  "--paper-shadow": "var(--paper-shadow-light)",
} as const

export type CssVarName = keyof typeof darkCssVars

export function applyCssVars(isDark: boolean): void {
  if (typeof document === "undefined") return
  const vars = isDark ? darkCssVars : lightCssVars
  const style = document.documentElement.style
  for (const [key, value] of Object.entries(vars)) {
    style.setProperty(key, value)
  }
  // Toggle class for scrollbar styling (CSS vars don't work in scrollbar pseudo-elements)
  if (isDark) {
    document.documentElement.classList.remove("light-theme")
  } else {
    document.documentElement.classList.add("light-theme")
  }
}

/**
 * Generates the inline script for layout.tsx to prevent theme flash.
 * This script runs before React hydration.
 */
export function generateThemeInitScript(): string {
  const lightVarsJson = JSON.stringify(lightCssVars)
  return `
(function() {
  try {
    var stored = localStorage.getItem('mathpad-preferences');
    var theme = stored ? JSON.parse(stored).theme : 'dark';
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      var vars = ${lightVarsJson};
      var s = document.documentElement.style;
      for (var key in vars) {
        s.setProperty(key, vars[key]);
      }
    }
  } catch(e) {}
})();
`
}

import { createContext, useContext } from "react";

/*
 * Declares which shell owns the visible NotificationBell for the current tree.
 *
 * The shared AuthShell renders its own bell in the top bar. A route that embeds
 * a legacy DashboardLayout inside that shell (Reports -> Analytics) would
 * otherwise mount a second NotificationBell: the Reports bridge stylesheet only
 * hides those legacy controls, and a hidden bell still opens its own WebSocket
 * and polls the brand-alert endpoints. DashboardLayout reads this context and
 * omits its nested bell when the surrounding AuthShell already owns one.
 *
 * The default is false, so every standalone DashboardLayout route keeps exactly
 * the bell it has today.
 */
const AuthShellContext = createContext({ ownsNotificationBell: false });

// Stable identity - an inline object literal on the provider would hand every
// consumer a new value on each AuthShell render.
export const AUTH_SHELL_OWNS_BELL = { ownsNotificationBell: true };

export function useAuthShellContext() {
  return useContext(AuthShellContext);
}

export default AuthShellContext;

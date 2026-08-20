/**
 * FontAwesome SSR configuration.
 * Import this file ONCE at the top of the app (app/layout.tsx or _app.tsx).
 * It disables the automatic <style> injection that causes hydration mismatches.
 */
import { config } from "@fortawesome/fontawesome-svg-core";

// Prevent FontAwesome from injecting its own <style> on the server.
// We import the CSS manually instead so it's consistent between SSR and client.
config.autoAddCss = false;

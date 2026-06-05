// Tiny prefixed logger so every line is grep-able in DevTools.
//
// Filter with the DevTools console search box: type `[headless]` to see only
// our messages. Each event prints the event name and a short summary.
//
// Disabled in production builds (`import.meta.env.DEV` is `false`) so
// customers who copy this code don't leak filenames, upload ids, or other
// diagnostic state to end-user consoles.

const STYLE = 'color:#2b6cb0;font-weight:600'

export function log(scope: string, msg: string, data?: unknown): void {
  if (!import.meta.env.DEV) return
  if (data === undefined) {
    console.log(`%c[headless:${scope}]`, STYLE, msg)
  } else {
    console.log(`%c[headless:${scope}]`, STYLE, msg, data)
  }
}

// Central config for the headless example. Both upload paths read their
// Transloadit credentials from here so there is a single source of truth:
//  - standard upload  → App.tsx → @uppy/transloadit plugin
//  - Dropbox import   → dropboxBridge.js → POST /assemblies
//
// Values come from environment variables (Vite loads them from `.env` at
// build/dev time). Copy `.env.example` to `.env` and fill in your values
// before running the example — there are no defaults.

function requireEnv(name: string, hint: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) {
    throw new Error(`${name} is required — copy .env.example to .env and ${hint}`)
  }
  return value
}

export const TRANSLOADIT_KEY: string = requireEnv(
  'VITE_TRANSLOADIT_KEY',
  'set it to your Transloadit auth key (https://transloadit.com/c/).',
)

export const TEMPLATE_ID: string = requireEnv(
  'VITE_TEMPLATE_ID',
  'set it to the id of the saved Transloadit template you want to run.',
)

// Full URL of the Companion instance. Used by the remote-source pickers and
// the bridge's /dropbox/bridge-tokens call.
export const COMPANION_URL: string = requireEnv(
  'VITE_COMPANION_URL',
  "set it to your Companion URL (e.g. 'http://localhost:3020' for local).",
)

// Live Transloadit API — same service `@uppy/transloadit` defaults to. The
// Dropbox import bridge POSTs its inline /dropbox/import Assembly here.
export const API2_URL = 'https://api2.transloadit.com'

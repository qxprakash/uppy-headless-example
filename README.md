# Headless Uppy + Transloadit

A reference React + Vite example that builds a complete upload UI from
`@uppy/react`'s **headless hooks** — no `Dashboard`, no `StatusBar`. Every
visible pixel is written in this example.

## Run it

```bash
cp .env.example .env
```

Edit `.env` and fill in `VITE_TRANSLOADIT_KEY` and `VITE_TEMPLATE_ID`.
`VITE_COMPANION_URL` defaults to Transloadit's hosted Companion — leave
it as is unless you run your own.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.



## Notes

See **[EXAMPLES.md](./EXAMPLES.md)** for a walkthrough of each upload
path and how to customize its Assembly template.

The two upload cards are independent — you can lift the standard
`UploadButton` on its own without taking the bridge.

The Dropbox bridge (`src/dropboxBridge.js`, `src/dropboxBridgeCore.js`)
is a reference implementation. It posts an inline `/dropbox/import`
Assembly to api2 directly and reads the Companion auth token from
`localStorage`. See [EXAMPLES.md](./EXAMPLES.md) for the production
hardening checklist before lifting it into your own codebase.

## Project layout

```
src/
  App.tsx                    Uppy instance + plugins + page layout
  config.ts                  Env-var reads, runtime guard
  logger.ts                  Dev-only diagnostic logger
  main.tsx                   React root
  app.css                    All styling
  dropboxBridge.js           Bridge: network + Assembly creation
  dropboxBridgeCore.js       Bridge: pure helpers (paths, template builder)
  components/                The headless UI
  hooks/                     useMediaQuery, useShiftKey, useSafeToCloseTab, useFocusTrap
vendor/
  uppy-transloadit-*.tgz     Pinned tarball — see "Bundled dependency"
```

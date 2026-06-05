# Upload examples in this project

This project ships **two upload paths** side by side. Each is a distinct
example of how to drive Transloadit from a headless React UI.

| Path | Tab can be closed? | Template lives in | Best for |
|---|---|---|---|
| Standard upload | After encoding starts | Transloadit dashboard (saved template) | Local files or any provider in the picker |
| Dropbox background import | Immediately | This codebase (`src/dropboxBridgeCore.js`) | Big Dropbox imports the user shouldn't have to babysit |

The user picks one via the radio tabs in `UploadTabs.tsx`.

---

## 1. Standard upload to Transloadit

**File:** `src/components/UploadButton.tsx`
**Plugin:** `@uppy/transloadit`

Streams every file (local + remote-via-Companion) into Transloadit's tus
endpoint, then triggers your saved template. The user must keep the tab
open until all bytes are uploaded; once Transloadit starts encoding,
`SafeToClosePopup` tells them it's safe to leave.

### Changing the template

The template is identified by the env var `VITE_TEMPLATE_ID` and the steps
themselves live in Transloadit's web dashboard:

1. Open <https://transloadit.com/c/template-credentials/>
2. Open the template whose id matches `VITE_TEMPLATE_ID`
3. Edit the JSON `steps` block in the editor, save
4. Refresh the example — no code change needed

To point the example at a **different** template:

```bash
# .env
VITE_TEMPLATE_ID=<new-template-id>
```

Restart the dev server. The plugin reads `VITE_TEMPLATE_ID` once at Uppy
construction (`src/App.tsx`).

---

## 2. Dropbox background import

**Files:** `src/components/DropboxBridgeButton.tsx`, `src/dropboxBridge.js`,
`src/dropboxBridgeCore.js`
**No Uppy upload plugin involved** — this path POSTs an Assembly directly.

Sequence:

1. The user signs in to Dropbox normally through the picker (standard
   `@uppy/remote-sources` OAuth flow).
2. The user selects Dropbox files and clicks **Dropbox background import**.
3. The bridge fetches a raw Dropbox access token from Companion's opt-in
   `/dropbox/bridge-tokens` endpoint.
4. The bridge **builds an Assembly template at runtime** that embeds the
   selected Dropbox file paths and the access token, then POSTs it to
   `https://api2.transloadit.com/assemblies`.
5. Transloadit pulls the files from Dropbox server-side. The user can
   close the tab.

### How the template is built on the fly

`buildImportTemplate(...)` (in `dropboxBridgeCore.js`) returns the full
Assembly params object every time the user clicks the button:

```js
{
  auth: { key: authKey },
  emit_execution_progress: true,
  steps: {
    imported: {                       // ← runtime-built
      robot: '/dropbox/import',
      access_token: accessToken,      // ← from Companion bridge
      path: [...paths],               // ← selected Dropbox file paths
    },
    ...steps,                          // ← your processing step-set
  },
}
```

The `imported` step is the *server-side equivalent* of the uploaded
`:original` files in a normal Assembly. Every downstream processing step
must `use: 'imported'` instead of `use: ':original'`.

### Changing the processing step-set

Two pre-built step-sets ship in `dropboxBridgeCore.js`:

```js
export const SIMPLE_STEPS = { /* single 200px resize */ }
export const FULL_STEPS   = { /* 10 thumbnail variants + optimize */ }
```

`src/dropboxBridge.js` picks which one to use:

```js
const template = buildImportTemplate({
  paths,
  accessToken,
  authKey: TRANSLOADIT_KEY,
  steps: FULL_STEPS,   // ← swap to SIMPLE_STEPS or your own object
})
```

To add your own processing:

```js
// in dropboxBridgeCore.js, or wherever you keep your steps:
export const MY_STEPS = {
  resized_hd: {
    robot: '/image/resize',
    use: 'imported',                  // ← stand-in for :original
    width: 1920,
  },
  webp: {
    robot: '/image/resize',
    use: 'imported',
    format: 'webp',
    quality: 85,
  },
  // ...add /s3/store, /video/encode, etc.
}
```

Then pass `steps: MY_STEPS` to `buildImportTemplate`. Anything Transloadit's
robots support is fair game — the bridge has no opinion about what runs
after the import.

---

## Why `@uppy/transloadit` is bundled locally

`package.json` pins `@uppy/transloadit` to a local tarball in `vendor/`
rather than a normal npm version:

```json
"@uppy/transloadit": "file:./vendor/uppy-transloadit-5.6.0-bridge.0.tgz"
```

The `AssemblyProgress` component reads encoding progress from
`state.plugins.Transloadit.assemblyStatus`. That plugin-state field was
**merged into `@uppy/transloadit` but is not yet on npm** — it'll ship
in the next release. The bundled tarball just contains that change so
the progress bar works today.

**Once it ships,** swap the line back to a normal version range and
delete the `vendor/` folder:

```json
"@uppy/transloadit": "^5.6.0"
```

Then `npm install`. No other code changes are required — the import
surface is identical.

The other three Uppy packages (`@uppy/core`, `@uppy/react`,
`@uppy/remote-sources`) already install from npm normally.

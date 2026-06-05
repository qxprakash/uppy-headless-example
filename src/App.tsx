import Uppy from '@uppy/core'
import { UppyContextProvider } from '@uppy/react'
import UppyRemoteSources from '@uppy/remote-sources'
import Transloadit, { COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit'
import { useState } from 'react'

import AssemblyProgress from './components/AssemblyProgress.js'
import MinimalDropArea from './components/MinimalDropArea.js'
import RemoteSourceModal, {
  type ProviderId,
} from './components/RemoteSourceModal.js'
import ResponsiveFileView from './components/ResponsiveFileView.js'
import SafeToClosePopup, {
  type PopupReason,
} from './components/SafeToClosePopup.js'
import UploadTabs from './components/UploadTabs.js'
import { COMPANION_URL, TEMPLATE_ID, TRANSLOADIT_KEY } from './config.js'
import { useSafeToCloseTab } from './hooks/useSafeToCloseTab.js'
import { log } from './logger.js'

function App() {
  const [uppy] = useState(() => {
    const instance = new Uppy({
      autoProceed: false,
      // Gated to development so verbose Uppy state — including filenames
      // and upload IDs — is never logged in production builds.
      debug: import.meta.env.DEV,
    })
      .use(UppyRemoteSources, {
        companionUrl: COMPANION_URL,
        // Transloadit's hosted Companion serves OAuth popups from per-region
        // subdomains (api2-xxxxxx.transloadit.com). Without an explicit
        // allowed-hosts pattern Uppy auto-derives a strict regex from the
        // companionUrl string, which silently drops postMessage events from
        // the subdomain — auth then appears to fail with "window was closed
        // by the user". Reuse the Transloadit plugin's own pattern so the
        // pickers accept any *.transloadit.com origin.
        companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
        sources: ['GoogleDrive', 'Dropbox', 'OneDrive'],
      })
      .use(Transloadit, {
        waitForEncoding: true,
        assemblyOptions: {
          params: {
            auth: { key: TRANSLOADIT_KEY },
            template_id: TEMPLATE_ID,
            // Opt in to SSE execution-progress events (`progress_combined`).
            // Off by default — without it Transloadit emits no
            // `assembly_execution_progress` messages, so the bar had no %.
            // @ts-expect-error valid Transloadit param, missing from
            // @transloadit/types' AssemblyInstructionsInput
            emit_execution_progress: true,
          },
        },
      })

    // Diagnostic logging — listeners are attached once at instance creation,
    // so they survive React StrictMode's double effect runs. These are for the
    // developer to verify the end-to-end flow in DevTools; they do not drive
    // any UI state (the components read everything from plugin state).
    instance.on('file-added', (file) =>
      log('uppy', `file-added: ${file.name}`, {
        id: file.id,
        size: file.size,
        isRemote: file.isRemote,
      }),
    )
    instance.on('upload', (uploadId, files) =>
      log('uppy', `upload started (${files.length} files)`, { uploadId }),
    )
    instance.on('upload-success', (file) =>
      log('uppy', `upload-success: ${file?.name}`),
    )
    instance.on('upload-error', (file, error) =>
      log('uppy', `upload-error: ${file?.name}`, error.message),
    )
    instance.on('complete', (result) =>
      log('uppy', 'complete', {
        successful: result.successful?.length ?? 0,
        failed: result.failed?.length ?? 0,
      }),
    )
    instance.on('error', (error) =>
      log('uppy', `error: ${error.message}`, error),
    )

    instance.on('transloadit:assembly-created', (assembly, fileIDs) =>
      log('transloadit', `assembly-created: ${assembly.assembly_id}`, {
        files: fileIDs,
      }),
    )
    instance.on('transloadit:assembly-executing', (assembly) =>
      log('transloadit', `assembly-executing: ${assembly.assembly_id}`),
    )
    instance.on('transloadit:complete', (assembly) =>
      log('transloadit', `assembly complete: ${assembly.assembly_id}`, {
        ok: assembly.ok,
      }),
    )
    instance.on('transloadit:assembly-error', (assembly, error) =>
      log('transloadit', `assembly-error: ${assembly.assembly_id}`, error),
    )

    log('uppy', 'instance created', { id: instance.getID() })
    return instance
  })

  const [openProvider, setOpenProvider] = useState<ProviderId | null>(null)
  const [bridgeAssemblyId, setBridgeAssemblyId] = useState<string | null>(null)

  // Drives the "safe to close" toast. The Dropbox background import wins when
  // present (most recent deliberate action, runs fully server-side); otherwise
  // the standard upload's encoding stage. A changing `id` re-arms the popup.
  const safeToClose = useSafeToCloseTab(uppy)
  const safeToCloseReason: PopupReason | null =
    bridgeAssemblyId != null
      ? {
          id: `bridge:${bridgeAssemblyId}`,
          message:
            'Your Dropbox files are importing on Transloadit — it runs ' +
            'server-side, so you can close this tab now.',
        }
      : safeToClose.safe && safeToClose.kind === 'encoding'
        ? { id: 'encoding', message: safeToClose.detail }
        : null

  // Intentionally no destroy effect. React 19 StrictMode runs effect cleanups
  // once on mount in dev, which would gut the Uppy instance (plugins removed,
  // store unsubscribed) before any upload could happen. The Uppy instance
  // lives for the page lifetime — browser teardown is sufficient cleanup.

  const modalOpen = openProvider != null

  return (
    <UppyContextProvider uppy={uppy}>
      {/* `inert` makes the rest of the page non-interactive AND aria-hidden
          while the modal is open — the modern equivalent of toggling
          `aria-hidden` + tabindex on every focusable descendant. */}
      <main className="app" inert={modalOpen}>
        <header className="masthead">
          {/* The visible header is just the badge; the page still needs one
              real heading for accessibility and the document outline. */}
          <h1 className="visually-hidden">
            Headless Uppy + Transloadit example
          </h1>
          <span className="masthead__badge">Headless example</span>
        </header>

        <section className="section">
          <h2>Add files</h2>
          <MinimalDropArea onPickProvider={setOpenProvider} />
        </section>

        <section className="section">
          <h2>Files</h2>
          <ResponsiveFileView />
        </section>

        <section className="section">
          <h2>Choose how to upload</h2>
          <UploadTabs
            companionUrl={COMPANION_URL}
            onImported={setBridgeAssemblyId}
          />
        </section>

        <section className="section">
          <h2>Assembly progress</h2>
          <AssemblyProgress />
        </section>

        <SafeToClosePopup
          key={safeToCloseReason?.id ?? 'idle'}
          reason={safeToCloseReason}
          onDismiss={() => setBridgeAssemblyId(null)}
        />
      </main>

      {modalOpen && (
        <RemoteSourceModal
          providerId={openProvider}
          onClose={() => setOpenProvider(null)}
        />
      )}
    </UppyContextProvider>
  )
}

export default App

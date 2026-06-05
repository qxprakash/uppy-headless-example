import { useUppyContext, useUppyState } from '@uppy/react'
import { useState } from 'react'
import { runDropboxBridge } from '../dropboxBridge.js'
import { log } from '../logger.js'
import { DropboxIcon } from './icons.js'
import TabContract from './TabContract.js'

interface Props {
  companionUrl: string
  /** Called once the /dropbox/import Assembly has been created server-side. */
  onImported?: (assemblyId: string) => void
}

// Status lives in React state — the component owns the message and renders
// it as JSX.
type BridgeStatus =
  | { kind: 'idle' }
  | { kind: 'running'; message: string }
  | { kind: 'done'; message: string; assemblyUrl?: string }
  | { kind: 'error'; message: string }

const STATUS_COLOR: Record<string, string> = {
  running: '#718096',
  done: '#276749',
  error: '#c53030',
}

// Background-import path: hands the picked Dropbox files to a server-side
// /dropbox/import Assembly. Once the Assembly exists the browser is no longer
// in the loop, so — unlike the standard upload — the tab can be closed.
export default function DropboxBridgeButton({
  companionUrl,
  onImported,
}: Props) {
  const { uppy } = useUppyContext()
  const dropboxCount = useUppyState(
    uppy,
    (s) =>
      Object.values(s.files).filter(
        (f) => f.isRemote && f.remote?.provider === 'dropbox',
      ).length,
  )
  const [status, setStatus] = useState<BridgeStatus>({ kind: 'idle' })
  const running = status.kind === 'running'
  // Once the import is triggered the work is server-side — keep the button
  // faded (like the standard upload's "Uploaded" state) so it reads as done.
  const triggered = status.kind === 'done'

  async function handleClick() {
    setStatus({ kind: 'running', message: 'Building Assembly…' })
    log('dropbox-bridge', `starting background import (${dropboxCount} files)`)
    try {
      const { assembly, paths } = await runDropboxBridge(uppy, companionUrl)
      setStatus({
        kind: 'done',
        message:
          `Assembly created for ${paths.length} file(s). You can close this ` +
          `tab — the import runs server-side.`,
        assemblyUrl: assembly.assembly_ssl_url,
      })
      log('dropbox-bridge', 'assembly created', assembly)
      onImported?.(assembly.assembly_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setStatus({ kind: 'error', message })
      log('dropbox-bridge', 'failed', message)
    }
  }

  return (
    <div className="path-card">
      <div className="path-card__head">
        <span className="path-card__icon path-card__icon--brand">
          <DropboxIcon size={20} />
        </span>
        <h3>Dropbox background import</h3>
      </div>

      <TabContract tone="safe" />

      <p className="path-card__desc">
        True server-side upload — Transloadit imports files directly from
        Dropbox.
      </p>

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={running || triggered || dropboxCount === 0}
        onClick={handleClick}
      >
        {running
          ? 'Importing…'
          : triggered
            ? 'Import triggered'
            : `Import ${dropboxCount} file${dropboxCount === 1 ? '' : 's'}`}
      </button>

      {status.kind !== 'idle' && (
        <p
          className="path-card__status"
          style={{ color: STATUS_COLOR[status.kind] ?? '#718096' }}
        >
          {status.message}
          {status.kind === 'done' && status.assemblyUrl && (
            <>
              {' '}
              <a href={status.assemblyUrl} target="_blank" rel="noreferrer">
                View Assembly
              </a>
            </>
          )}
        </p>
      )}
    </div>
  )
}

import { useRemoteSource } from '@uppy/react'
import { useRef, useState } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap.js'
import { useShiftKey } from '../hooks/useShiftKey.js'
import { log } from '../logger.js'
import {
  CloseIcon,
  DropboxIcon,
  FileIcon,
  FolderIcon,
  GoogleDriveIcon,
  GridIcon,
  ListIcon,
  OneDriveIcon,
} from './icons.js'

export type ProviderId = 'GoogleDrive' | 'Dropbox' | 'OneDrive'

const PROVIDER_META: Record<
  ProviderId,
  { label: string; Icon: typeof DropboxIcon }
> = {
  GoogleDrive: { label: 'Google Drive', Icon: GoogleDriveIcon },
  Dropbox: { label: 'Dropbox', Icon: DropboxIcon },
  OneDrive: { label: 'OneDrive', Icon: OneDriveIcon },
}

interface Props {
  providerId: ProviderId
  onClose: () => void
}

export default function RemoteSourceModal({ providerId, onClose }: Props) {
  const remote = useRemoteSource(providerId)
  const { state } = remote
  // Shift-held state, for range selection (see useShiftKey).
  const shiftKey = useShiftKey()
  const { label: providerLabel, Icon: ProviderBrandIcon } =
    PROVIDER_META[providerId]
  const [authError, setAuthError] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('grid')

  // W3C dialog focus management: focus the first focusable child on open,
  // trap Tab/Shift+Tab inside, restore focus on close. Combined with the
  // `inert` attribute on <main> in App.tsx this gives a fully isolated modal.
  const modalRef = useRef<HTMLDivElement | null>(null)
  useFocusTrap(modalRef)

  // The OAuth popup flow in @uppy/companion-client races a `popup.closed`
  // poller (Provider.ts:249-256) against the WebSocket that delivers the auth
  // token. With strict COOP on the popup, the poller can win even when auth
  // succeeded, and the rejection is swallowed by handleAuth's catch in
  // provider-views (ProviderView.tsx:465). Surface the error so the user
  // knows what happened and can retry.
  async function handleLogin() {
    setAuthError(null)
    setAuthPending(true)
    log('remote', `login start: ${providerId}`)
    try {
      await remote.login()
      log('remote', `login resolved: ${providerId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log('remote', `login rejected: ${providerId}`, message)
      setAuthError(message)
    } finally {
      setAuthPending(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${providerLabel} picker`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <button
        type="button"
        aria-label="Close picker"
        className="modal-backdrop__close"
        onClick={onClose}
      />
      <div className="modal" ref={modalRef} tabIndex={-1}>
        <header className="modal__header">
          <span className="modal__title">
            <ProviderBrandIcon size={20} />
            {providerLabel}
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close picker"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </header>

        <div className="modal__body">
          {!state.authenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                className="btn btn--primary"
                disabled={authPending}
                onClick={handleLogin}
              >
                {authPending
                  ? 'Waiting for popup…'
                  : authError
                    ? `Retry sign in to ${providerId}`
                    : `Sign in to ${providerId}`}
              </button>
              {authError && (
                <div
                  style={{
                    color: '#c53030',
                    fontSize: 13,
                    background: '#fff5f5',
                    border: '1px solid #fc8181',
                    borderRadius: 6,
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Auth did not complete
                  </div>
                  <div>{authError}</div>
                  <div style={{ marginTop: 6, color: '#742a2a' }}>
                    If you actually finished signing in, the popup-closed
                    detector in @uppy/companion-client raced ahead of the
                    auth-token WebSocket (a known issue with strict COOP). Click
                    Retry — auth should succeed on the second pass.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="tree-toolbar">
                <nav className="crumbs">
                  {state.breadcrumbs.map((crumb, i) => (
                    <span key={crumb.id ?? `root-${i}`}>
                      <button
                        type="button"
                        onClick={() => remote.open(crumb.id)}
                      >
                        {i === 0
                          ? (state.username ?? 'Home')
                          : ('data' in crumb && crumb.data?.name) || '…'}
                      </button>
                      {i < state.breadcrumbs.length - 1 ? ' / ' : ''}
                    </span>
                  ))}
                </nav>
                <div className="view-toggle" role="group" aria-label="View">
                  <button
                    type="button"
                    className={`view-toggle__btn${
                      view === 'list' ? ' view-toggle__btn--active' : ''
                    }`}
                    aria-pressed={view === 'list'}
                    aria-label="List view"
                    onClick={() => setView('list')}
                  >
                    <ListIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className={`view-toggle__btn${
                      view === 'grid' ? ' view-toggle__btn--active' : ''
                    }`}
                    aria-pressed={view === 'grid'}
                    aria-label="Grid view"
                    onClick={() => setView('grid')}
                  >
                    <GridIcon size={16} />
                  </button>
                </div>
              </div>

              {state.loading ? (
                <div style={{ color: '#718096' }}>Loading…</div>
              ) : (
                <div className={view === 'grid' ? 'tree-grid' : 'tree-list'}>
                  {state.partialTree
                    .filter((node) => node.type !== 'root')
                    .map((node) => {
                      const isFolder = node.type === 'folder'
                      const name =
                        'data' in node && node.data?.name
                          ? node.data.name
                          : node.id
                      const thumbnail =
                        'data' in node &&
                        typeof node.data?.thumbnail === 'string'
                          ? node.data.thumbnail
                          : undefined

                      // Identical in both views — only the layout differs.
                      // `indeterminate` is a DOM-only property (folders can be
                      // partially selected), so it's set imperatively via ref.
                      const checkbox = (
                        <input
                          type="checkbox"
                          className="tree-check"
                          checked={node.status === 'checked'}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = node.status === 'partial'
                            }
                          }}
                          onChange={() =>
                            remote.checkbox(node, shiftKey.current === true)
                          }
                          aria-label={
                            isFolder
                              ? `Select folder ${name}`
                              : `Select ${name}`
                          }
                        />
                      )

                      if (view === 'grid') {
                        return (
                          <div
                            key={node.id}
                            className={`tree-tile${
                              node.status === 'checked'
                                ? ' tree-tile--selected'
                                : ''
                            }`}
                          >
                            <span className="tree-tile__check">{checkbox}</span>
                            {isFolder ? (
                              <button
                                type="button"
                                className="tree-tile__body"
                                onClick={() => remote.open(node.id)}
                              >
                                <span className="tree-tile__media tree-tile__media--folder">
                                  <FolderIcon size={30} />
                                </span>
                                <span className="tree-tile__name">{name}</span>
                              </button>
                            ) : (
                              <div className="tree-tile__body">
                                <span
                                  className={`tree-tile__media${
                                    thumbnail ? '' : ' tree-tile__media--file'
                                  }`}
                                >
                                  {thumbnail ? (
                                    <img
                                      className="tree-tile__thumb"
                                      src={thumbnail}
                                      alt=""
                                      loading="lazy"
                                    />
                                  ) : (
                                    <FileIcon size={30} />
                                  )}
                                </span>
                                <span className="tree-tile__name">{name}</span>
                              </div>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div key={node.id} className="tree-row">
                          {checkbox}
                          {isFolder ? (
                            <button
                              type="button"
                              className="tree-row__btn"
                              onClick={() => remote.open(node.id)}
                            >
                              <span className="tree-row__icon tree-row__icon--folder">
                                <FolderIcon size={16} />
                              </span>
                              <span className="tree-row__name">{name}</span>
                            </button>
                          ) : (
                            <>
                              <span className="tree-row__icon tree-row__icon--file">
                                <FileIcon size={16} />
                              </span>
                              <span className="tree-row__name">{name}</span>
                            </>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}

              {state.error && (
                <div style={{ marginTop: 8, color: '#c53030', fontSize: 13 }}>
                  {state.error}
                </div>
              )}
            </>
          )}
        </div>

        <footer className="modal__footer">
          {state.authenticated && (
            <button
              type="button"
              className="btn"
              onClick={() => remote.logout()}
            >
              Sign out
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              remote.cancel()
              onClose()
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!state.authenticated || state.selectedAmount === 0}
            onClick={() => {
              remote.done()
              onClose()
            }}
          >
            Add {state.selectedAmount > 0 ? `(${state.selectedAmount})` : ''}
          </button>
        </footer>
      </div>
    </div>
  )
}

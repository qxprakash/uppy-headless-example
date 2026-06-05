import { useUppyContext, useUppyState } from '@uppy/react'
import type { CSSProperties } from 'react'
import { log } from '../logger.js'
import { UploadIcon } from './icons.js'
import TabContract from './TabContract.js'

// Standard upload path: streams every file — local and remote — to Transloadit
// through the browser. The tab must stay open until it finishes, which is the
// whole reason this is presented as a distinct card from the Dropbox bridge.
export default function UploadButton() {
  const { uppy, status, progress } = useUppyContext()
  const fileCount = useUppyState(uppy, (s) => Object.keys(s.files).length)
  const canUpload = status === 'ready' && fileCount > 0

  const label =
    status === 'uploading'
      ? `Uploading ${progress}%`
      : status === 'complete'
        ? 'Uploaded'
        : `Upload ${fileCount} file${fileCount === 1 ? '' : 's'}`

  return (
    <div className="path-card">
      <div className="path-card__head">
        <span className="path-card__icon">
          <UploadIcon size={20} />
        </span>
        <h3>Upload to Transloadit</h3>
      </div>

      <TabContract tone="blocking" />

      <p className="path-card__desc">
        Streams remote files from companion to
        Transloadit.
      </p>

      <button
        type="button"
        className={`btn btn--primary btn--block${
          status === 'uploading' ? ' btn--progress' : ''
        }`}
        style={
          status === 'uploading'
            ? ({ '--progress': `${progress}%` } as CSSProperties)
            : undefined
        }
        disabled={!canUpload}
        onClick={() => {
          log('ui', `upload clicked (${fileCount} files)`)
          // Fire-and-forget: the rejected promise from `uppy.upload()` is
          // surfaced via App-level `upload-error` / `error` event listeners,
          // so we deliberately don't await or .catch() it here.
          uppy.upload()
        }}
      >
        {status === 'uploading' ? (
          <>
            {/* Accent fill grows with `--progress`; the white label copy is
                clip-path'd to the same width so text reads on both sides. */}
            <span className="btn__bg" aria-hidden />
            <span className="btn__base">{label}</span>
            <span className="btn__fill" aria-hidden>
              {label}
            </span>
          </>
        ) : (
          label
        )}
      </button>
    </div>
  )
}

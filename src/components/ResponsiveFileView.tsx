import type { Body, Meta, UppyFile } from '@uppy/core'
import { useUppyContext, useUppyState } from '@uppy/react'
import { useEffect, useState } from 'react'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../hooks/useMediaQuery.js'

type AnyUppyFile = UppyFile<Meta, Body>

function prettyBytes(n: number | undefined): string {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Returns a preview URL for the file. If `file.preview` is already set
 * (e.g. by the thumbnail generator) it's used as-is. Otherwise — if the
 * file data is a Blob — a fresh object URL is created and revoked on
 * unmount or when the input changes to avoid the memory leak that occurs
 * when callers forget to call `URL.revokeObjectURL`.
 */
function useFilePreviewURL(file: AnyUppyFile): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => file.preview)

  useEffect(() => {
    if (file.preview) {
      setUrl(file.preview)
      return
    }
    if (file.data instanceof Blob) {
      const objectUrl = URL.createObjectURL(file.data)
      setUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    setUrl(undefined)
  }, [file.preview, file.data])

  return url
}

interface FileGridCellProps {
  file: AnyUppyFile
}

function FileGridCell({ file }: FileGridCellProps) {
  const url = useFilePreviewURL(file)
  return (
    <div className="file-grid__cell">
      {url && file.type?.startsWith('image/') ? (
        <img className="file-grid__thumb" src={url} alt={file.name ?? ''} />
      ) : (
        <div
          className="file-grid__thumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: '#718096',
          }}
        >
          {file.extension?.toUpperCase() ?? 'FILE'}
        </div>
      )}
      <span className="file-grid__name" title={file.name}>
        {file.name}
      </span>
    </div>
  )
}

// Grid on small screens, list on larger ones. Uses the Thumbnail primitive
// for images, falls back to a type label otherwise.
export default function ResponsiveFileView() {
  const { uppy } = useUppyContext()
  const files = useUppyState(uppy, (s) => s.files)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const entries = Object.values(files) as AnyUppyFile[]

  if (entries.length === 0) {
    return (
      <div style={{ color: '#718096', fontSize: 14 }}>No files selected.</div>
    )
  }

  if (isMobile) {
    return (
      <div className="file-grid">
        {entries.map((file) => (
          <FileGridCell key={file.id} file={file} />
        ))}
      </div>
    )
  }

  return (
    <div className="file-list">
      {entries.map((file) => (
        <div key={file.id} className="file-list__row">
          <div className="file-list__name" title={file.name}>
            {file.name}
          </div>
          <div className="file-list__meta">
            {prettyBytes(file.size ?? undefined)}
            {file.isRemote ? ' · remote' : ''}
            {file.progress?.uploadComplete ? ' · ✓' : ''}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => uppy.removeFile(file.id)}
            aria-label={`Remove ${file.name}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

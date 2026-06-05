import { useDropzone, useFileInput } from '@uppy/react'
import { useState } from 'react'
import { log } from '../logger.js'
import {
  DeviceIcon,
  DropboxIcon,
  GoogleDriveIcon,
  OneDriveIcon,
  UploadIcon,
} from './icons.js'
import type { ProviderId } from './RemoteSourceModal.js'

interface Props {
  onPickProvider: (id: ProviderId) => void
}

const PROVIDERS: ReadonlyArray<{
  id: ProviderId
  label: string
  Icon: typeof DropboxIcon
}> = [
  { id: 'GoogleDrive', label: 'Google Drive', Icon: GoogleDriveIcon },
  { id: 'Dropbox', label: 'Dropbox', Icon: DropboxIcon },
  { id: 'OneDrive', label: 'OneDrive', Icon: OneDriveIcon },
]

// Headless "add files" surface: a drop target plus a row of source chips.
// It only gets files *into* Uppy — the upload paths render their own triggers.
export default function MinimalDropArea({ onPickProvider }: Props) {
  const [dragging, setDragging] = useState(false)

  const { getRootProps, getInputProps } = useDropzone({
    noClick: true,
    onDragEnter: () => setDragging(true),
    onDragLeave: () => setDragging(false),
    onDrop: () => setDragging(false),
  })
  const {
    getButtonProps: getDeviceButtonProps,
    getInputProps: getPickerProps,
  } = useFileInput()

  return (
    <div className="add-files">
      <div
        {...getRootProps()}
        className={`dropzone${dragging ? ' dropzone--active' : ''}`}
      >
        <input {...getInputProps()} hidden />
        <span className="dropzone__icon">
          <UploadIcon size={20} />
        </span>
        <div className="dropzone__title">Drop files here</div>
        <div className="dropzone__hint">or pick a source below</div>
      </div>

      <div className="sources">
        <input {...getPickerProps()} hidden />
        <button
          className="source"
          aria-label="Add from your device"
          title="Device"
          {...getDeviceButtonProps()}
        >
          <DeviceIcon size={36} />
        </button>
        {PROVIDERS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="source"
            aria-label={`Add from ${label}`}
            title={label}
            onClick={() => {
              log('ui', `pick provider: ${id}`)
              onPickProvider(id)
            }}
          >
            <Icon size={36} />
          </button>
        ))}
      </div>
    </div>
  )
}

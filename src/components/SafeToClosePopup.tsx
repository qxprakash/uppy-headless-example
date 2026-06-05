import { useState } from 'react'
import { CheckCircleIcon, CloseIcon } from './icons.js'

export interface PopupReason {
  /** Unique per trigger — App keys the component by this, so a new id
   *  remounts the toast (re-arms dismissal, replays the slide-in). */
  id: string
  message: string
}

interface Props {
  reason: PopupReason | null
  onDismiss: () => void
}

// Presentational slide-in toast for "safe to close this tab" moments. App
// decides *when* to show it (standard-upload encoding, or a Dropbox import
// handed off server-side) and keys this component by `reason.id`.
export default function SafeToClosePopup({ reason, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (reason == null || dismissed) return null

  return (
    <div className="toast" role="status">
      <span className="toast__icon" aria-hidden>
        <CheckCircleIcon size={20} />
      </span>
      <div className="toast__body">
        <div className="toast__title">Safe to close this tab</div>
        <p className="toast__text">{reason.message}</p>
      </div>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss"
        onClick={() => {
          setDismissed(true)
          onDismiss()
        }}
      >
        <CloseIcon size={16} />
      </button>
    </div>
  )
}

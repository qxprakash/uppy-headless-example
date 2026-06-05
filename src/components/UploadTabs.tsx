import { useState } from 'react'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../hooks/useMediaQuery.js'
import DropboxBridgeButton from './DropboxBridgeButton.js'
import UploadButton from './UploadButton.js'

type TabId = 'companion' | 'dropbox'

interface Props {
  companionUrl: string
  onImported: (assemblyId: string) => void
}

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'companion', label: 'Regular Companion Upload' },
  { id: 'dropbox', label: 'Dropbox Server-side Upload' },
]

// The two upload paths. On wide screens they sit side by side as cards; below
// the shared MOBILE_BREAKPOINT (the same width at which the file view becomes
// a grid) they collapse into tabs so they don't stack awkwardly.
export default function UploadTabs({ companionUrl, onImported }: Props) {
  const isNarrow = useMediaQuery(MOBILE_BREAKPOINT)
  const [active, setActive] = useState<TabId>('companion')

  const companion = <UploadButton />
  const dropbox = (
    <DropboxBridgeButton companionUrl={companionUrl} onImported={onImported} />
  )

  if (!isNarrow) {
    return (
      <div className="path-cards">
        {companion}
        {dropbox}
      </div>
    )
  }

  return (
    <div>
      <div className="tabs__bar" role="tablist" aria-label="Upload method">
        {TABS.map((tab) => {
          const selected = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              className={`tabs__tab${selected ? ' tabs__tab--active' : ''}`}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="panel-companion"
        aria-labelledby="tab-companion"
        hidden={active !== 'companion'}
      >
        {companion}
      </div>
      <div
        role="tabpanel"
        id="panel-dropbox"
        aria-labelledby="tab-dropbox"
        hidden={active !== 'dropbox'}
      >
        {dropbox}
      </div>
    </div>
  )
}

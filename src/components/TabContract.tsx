import { AlertCircleIcon, CheckCircleIcon } from './icons.js'

// The two upload paths differ in exactly one user-visible way: whether the tab
// can be closed mid-flight. That contract gets its own row — icon + label,
// colour-coded — so it reads at a glance instead of being buried in prose.
type Tone = 'blocking' | 'safe'

interface Props {
  tone: Tone
}

const COPY: Record<Tone, string> = {
  blocking: 'Keep tab open until encoding starts',
  safe: 'Safe to close the tab',
}

export default function TabContract({ tone }: Props) {
  return (
    <div className={`tab-contract tab-contract--${tone}`}>
      {tone === 'blocking' ? (
        <AlertCircleIcon size={16} />
      ) : (
        <CheckCircleIcon size={16} />
      )}
      <span>{COPY[tone]}</span>
    </div>
  )
}

import { useUppyContext, useUppyState } from '@uppy/react'
import { useEffect, useRef } from 'react'
import { log } from '../logger.js'

// Narrow view of the Transloadit plugin state. The full AssemblyStatus is a
// giant discriminated union from @transloadit/types — we only need the
// fields below, so a local type keeps the read site readable.
type AssemblySlice = {
  ok?: string | null
  error?: unknown
  assembly_id?: string
  progress_combined?: number // encoding progress, 0..100
  bytes_received?: number // upload progress
  bytes_expected?: number | null
}

type TransloaditSlice =
  | {
      assemblyStatus?: AssemblySlice
      lastAssemblyStatus?: AssemblySlice
    }
  | undefined

const STAGE_LABEL: Record<string, string> = {
  ASSEMBLY_UPLOADING: 'Uploading to Transloadit…',
  ASSEMBLY_EXECUTING: 'Encoding on Transloadit…',
  ASSEMBLY_COMPLETED: 'Encoding complete',
  ASSEMBLY_CANCELED: 'Canceled',
  ASSEMBLY_EXPIRED: 'Expired',
  REQUEST_ABORTED: 'Aborted',
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

// Custom assembly progress UI, driven entirely by `plugins.Transloadit` state
// (assemblyStatus was added to plugin state in commit 57f8daf55 / #6267
// specifically so consumers can build UI like this without wiring up events).
//
// One subscription, one source of truth: no events, no local state.
export default function AssemblyProgress() {
  const { uppy } = useUppyContext()
  const slice = useUppyState(
    uppy,
    (s) => s.plugins?.Transloadit as TransloaditSlice,
  )

  // assemblyStatus clears when the live assembly object is unset; fall back to
  // lastAssemblyStatus so the bar keeps showing the previous run's final value.
  const assembly = slice?.assemblyStatus ?? slice?.lastAssemblyStatus

  // Log every stage transition seen in plugin state so the developer can verify
  // the lifecycle without opening the Transloadit dashboard.
  const prevStageRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const stage = assembly?.ok ?? undefined
    if (stage && stage !== prevStageRef.current) {
      log('assembly', `stage: ${prevStageRef.current ?? '—'} → ${stage}`, {
        assembly_id: assembly?.assembly_id,
        progress_combined: assembly?.progress_combined,
        bytes_received: assembly?.bytes_received,
        bytes_expected: assembly?.bytes_expected,
      })
      prevStageRef.current = stage
    }
  }, [
    assembly?.ok,
    assembly?.assembly_id,
    assembly?.progress_combined,
    assembly?.bytes_received,
    assembly?.bytes_expected,
  ])

  // Log every distinct (stage, progress_combined, bytes_received) tuple we
  // observe. For remote uploads via Companion, expect bytes_received to equal
  // bytes_expected on the very first sample (Companion already pushed the
  // bytes before our first poll). For a fast template, expect progress_combined
  // to jump 0 → 100 with at most one or two intermediate samples.
  //
  // We capture the primitives in locals so the effect's dep array contains
  // only stable values — depending on the parent `assembly` object directly
  // would re-fire on every state tick (it's a new reference each time).
  const ok = assembly?.ok
  const progressCombined = assembly?.progress_combined
  const bytesReceived = assembly?.bytes_received
  const bytesExpected = assembly?.bytes_expected
  const prevSampleRef = useRef<string>('')
  useEffect(() => {
    if (ok == null) return
    const sample = JSON.stringify({
      ok,
      progress_combined: progressCombined,
      bytes_received: bytesReceived,
      bytes_expected: bytesExpected,
    })
    if (sample !== prevSampleRef.current) {
      prevSampleRef.current = sample
      log('assembly:sample', `tick`, JSON.parse(sample))
    }
  }, [ok, progressCombined, bytesReceived, bytesExpected])

  if (!assembly) {
    return (
      <div style={{ color: '#718096', fontSize: 14 }}>
        No assembly yet — upload a file to start one.
      </div>
    )
  }

  const stage = assembly.ok ?? 'UNKNOWN'
  const label = STAGE_LABEL[stage] ?? stage
  const isComplete = stage === 'ASSEMBLY_COMPLETED'
  const isExecuting = stage === 'ASSEMBLY_EXECUTING'
  const isError = Boolean(assembly.error)

  // Upload progress is rendered by UploadButton. During ASSEMBLY_UPLOADING the
  // encoding hasn't begun — show an indeterminate bar (a genuine "waiting,
  // about to start" state, not a faked percentage). The real determinate bar
  // takes over once encoding starts.
  if (stage === 'ASSEMBLY_UPLOADING' && !isError) {
    return (
      <div>
        <div className="stage-line">
          <span>Waiting for encoding to start…</span>
        </div>
        <div className="progress">
          <div className="progress__bar progress__bar--indeterminate" />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#718096' }}>
          Assembly <code>{assembly.assembly_id ?? '—'}</code>
        </div>
      </div>
    )
  }

  // progress_combined is a PERCENT (0..100).
  const encodingFraction = clamp01((assembly.progress_combined ?? 0) / 100)
  const fraction = isComplete || isError ? 1 : encodingFraction

  return (
    <div>
      <div className="stage-line">
        <span>{isError ? 'Assembly errored' : label}</span>
        <span>
          {isError ? '' : isExecuting ? `${Math.round(fraction * 100)}%` : ''}
        </span>
      </div>
      <div className="progress">
        <div
          className={
            isError
              ? 'progress__bar progress__bar--error'
              : isComplete
                ? 'progress__bar progress__bar--complete'
                : 'progress__bar'
          }
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#718096' }}>
        Assembly <code>{assembly.assembly_id ?? '—'}</code>
      </div>
    </div>
  )
}

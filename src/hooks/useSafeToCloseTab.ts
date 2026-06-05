import type { Uppy } from '@uppy/core'
import { useUppyState } from '@uppy/react'
import type { AssemblyResponse } from '@uppy/transloadit'

export type SafeToCloseReason =
  | { safe: true; kind: 'encoding'; detail: string }
  | { safe: true; kind: 'remote-inflight'; detail: string }
  | { safe: false; reason: string }

// Derives whether the user can safely close this tab.
//
// Two paths to "safe":
//
// 1. Transloadit encoding: once `assemblyStatus.ok` reaches ASSEMBLY_EXECUTING
//    or ASSEMBLY_COMPLETED, every byte has left the browser. Encoding runs on
//    Transloadit's servers regardless of whether the tab is open.
//
// 2. Companion remote uploads: when every remote file's upload has started
//    (`progress.uploadStarted` is set), Companion holds the bytes and finishes
//    the upload to the destination server-side. We also require every *local*
//    file to be fully done — those need the tab open.
//
// Caveat we should be honest about: `uploadStarted` flips the moment Uppy
// begins the upload attempt, which is slightly before Companion confirms it
// has the file. The real handoff signal lives inside RequestClient's socket
// and isn't yet exposed as a public event — see RequestClient.ts. A small
// follow-up could emit `'companion:upload-started'` on the first socket
// progress message. For an example, the approximation is fine.
export function useSafeToCloseTab(uppy: Uppy): SafeToCloseReason {
  const assemblyStage = useUppyState(
    uppy,
    (s) =>
      (
        s.plugins?.Transloadit as
          | { assemblyStatus?: AssemblyResponse }
          | undefined
      )?.assemblyStatus?.ok,
  )

  const files = useUppyState(uppy, (s) => s.files)
  const entries = Object.values(files)

  if (
    assemblyStage === 'ASSEMBLY_EXECUTING' ||
    assemblyStage === 'ASSEMBLY_COMPLETED'
  ) {
    return {
      safe: true,
      kind: 'encoding',
      detail:
        assemblyStage === 'ASSEMBLY_COMPLETED'
          ? 'Encoding finished. You can close this tab.'
          : 'All bytes uploaded. Encoding continues on Transloadit — you can close this tab.',
    }
  }

  if (entries.length === 0) {
    return { safe: false, reason: 'No files yet.' }
  }

  const remote = entries.filter((f) => f.isRemote)
  const local = entries.filter((f) => !f.isRemote)

  if (remote.length === 0) {
    return { safe: false, reason: 'Local uploads need the tab open.' }
  }

  const allLocalDone = local.every((f) => f.progress?.uploadComplete)
  const allRemoteInFlight = remote.every(
    (f) => f.progress?.uploadStarted != null && !f.progress?.uploadComplete,
  )
  const allRemoteDone = remote.every((f) => f.progress?.uploadComplete)

  if (allRemoteDone && allLocalDone) {
    return {
      safe: true,
      kind: 'remote-inflight',
      detail: 'All uploads finished.',
    }
  }

  if (allRemoteInFlight && allLocalDone) {
    return {
      safe: true,
      kind: 'remote-inflight',
      detail:
        'All remote uploads are running on Companion — they will finish even if you close this tab.',
    }
  }

  return { safe: false, reason: 'Uploads still need the tab open.' }
}

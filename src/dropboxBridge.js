// Dropbox import bridge — network and Assembly creation only.
// Turns a Dropbox file selection into a server-side /dropbox/import Assembly so
// the user can close the tab while the import runs. The headless example
// drives this through the <DropboxBridgeButton> React component, which calls
// `runDropboxBridge` below.
import { API2_URL, TRANSLOADIT_KEY } from './config.js'
// To run the minimal-resize template instead of the full one, also import
// `SIMPLE_STEPS` here and pass it into `buildImportTemplate` below.
import {
  buildImportTemplate,
  collectDropboxPaths,
  FULL_STEPS,
} from './dropboxBridgeCore.js'

// companion-client stores the encrypted uppyAuthToken in localStorage after sign-in.
function getDropboxAuthToken() {
  const direct = localStorage.getItem('companion-Dropbox-auth-token')
  if (direct != null) return direct
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key != null && /dropbox/i.test(key) && key.includes('auth-token')) {
      return localStorage.getItem(key)
    }
  }
  return null
}

async function fetchBridgeAccessToken(companionUrl) {
  const authToken = getDropboxAuthToken()
  if (authToken == null) {
    throw new Error(
      'No Dropbox session — open Dropbox in the Dashboard and pick files first.',
    )
  }
  const response = await fetch(`${companionUrl}/dropbox/bridge-tokens`, {
    headers: { 'uppy-auth-token': authToken },
  })
  if (!response.ok) {
    throw new Error(`bridge-tokens endpoint returned HTTP ${response.status}`)
  }
  const { accessToken } = await response.json()
  return accessToken
}

async function createBridgeAssembly(paths, accessToken) {
  const template = buildImportTemplate({
    paths,
    accessToken,
    authKey: TRANSLOADIT_KEY,
    steps: FULL_STEPS, // ← swap to SIMPLE_STEPS for the minimal resize template
  })

  const form = new FormData()
  // The shared demo key has no Signature Authentication, so — like the standard
  // upload path — the request is unsigned: just the JSON-encoded params.
  form.append('params', JSON.stringify(template))
  form.append('num_expected_upload_files', '0')

  const response = await fetch(`${API2_URL}/assemblies`, {
    method: 'POST',
    body: form,
  })

  // The body may not be JSON (e.g. a 502 HTML page from a reverse proxy).
  // Parse defensively so the user sees a useful message rather than a
  // SyntaxError swallowing the real status code.
  let assembly
  try {
    assembly = await response.json()
  } catch {
    throw new Error(
      `Assembly creation failed: HTTP ${response.status} (non-JSON response)`,
    )
  }
  if (!response.ok && assembly?.ok == null) {
    throw new Error(
      `Assembly creation failed: ${assembly?.error ?? response.status}`,
    )
  }
  return assembly
}

/**
 * Collects the picked Dropbox paths, fetches the bridged access token from
 * Companion, and creates the server-side /dropbox/import Assembly on api2.
 * Throws if no Dropbox files are selected or any step fails — the caller
 * (<DropboxBridgeButton>) renders the outcome.
 *
 * @param {import('@uppy/core').Uppy} uppy
 * @param {string} companionUrl
 * @returns {Promise<{ assembly: Record<string, any>, paths: string[] }>}
 */
export async function runDropboxBridge(uppy, companionUrl) {
  const paths = collectDropboxPaths(uppy.getFiles())
  if (paths.length === 0) {
    throw new Error(
      'No Dropbox files selected. Open the Dropbox picker and add files first.',
    )
  }
  const accessToken = await fetchBridgeAccessToken(companionUrl)
  const assembly = await createBridgeAssembly(paths, accessToken)
  return { assembly, paths }
}

// Re-export the pure helpers so consumers can import everything from one place.
export { buildImportTemplate, collectDropboxPaths }

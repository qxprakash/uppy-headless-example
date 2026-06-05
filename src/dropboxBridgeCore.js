// Dropbox import bridge — pure helpers. Network wiring lives in dropboxBridge.js.

/**
 * Returns the canonical Dropbox API paths for the remote Dropbox files in an Uppy
 * file selection. Companion exposes each picked file's Dropbox `path_lower` as a
 * URL-encoded `requestPath`, which is exactly what the /dropbox/import `path`
 * parameter expects.
 *
 * @param {ReadonlyArray<{
 *   isRemote?: boolean
 *   remote?: { provider?: string }
 *   data?: { requestPath?: string }
 * }>} files
 * @returns {string[]}
 */
export function collectDropboxPaths(files) {
  const paths = []
  for (const file of files) {
    if (file?.isRemote !== true) continue
    if (file?.remote?.provider !== 'dropbox') continue
    const requestPath = file?.data?.requestPath
    if (requestPath == null || requestPath === '') continue
    paths.push(decodeURIComponent(requestPath))
  }
  return paths
}

// ---------------------------------------------------------------------------
// Processing step-sets for the bridge Assembly.
//
// Each is a self-contained `steps` object that `buildImportTemplate` composes
// with the dynamic `imported` (/dropbox/import) step. Every step `use`s
// "imported" — the import output — NOT ":original", because a bridge Assembly
// has no uploaded files.
// ---------------------------------------------------------------------------

/** Minimal step-set: a single 200px resize. */
export const SIMPLE_STEPS = {
  resized: {
    robot: '/image/resize',
    use: 'imported',
    width: 200,
    result: true,
  },
}

/**
 * Full step-set: 10 resize variants, each passed through /image/optimize.
 * Mirrors a real image-processing template; the original's /s3/store
 * "exported" step is omitted so large test runs don't incur S3 storage cost.
 */
export const FULL_STEPS = {
  thumb_64: {
    robot: '/image/resize',
    use: 'imported',
    width: 64,
    height: 64,
    resize_strategy: 'fit',
    format: 'jpg',
    imagemagick_stack: 'v3.0.1',
  },
  thumb_64_optimized: { robot: '/image/optimize', use: 'thumb_64' },

  thumb_128: {
    robot: '/image/resize',
    use: 'imported',
    width: 128,
    height: 128,
    resize_strategy: 'fit',
    format: 'jpg',
    imagemagick_stack: 'v3.0.1',
  },
  thumb_128_optimized: { robot: '/image/optimize', use: 'thumb_128' },

  thumb_256: {
    robot: '/image/resize',
    use: 'imported',
    width: 256,
    height: 256,
    resize_strategy: 'fit',
    format: 'jpg',
    imagemagick_stack: 'v3.0.1',
  },
  thumb_256_optimized: { robot: '/image/optimize', use: 'thumb_256' },

  thumb_512: {
    robot: '/image/resize',
    use: 'imported',
    width: 512,
    height: 512,
    resize_strategy: 'fit',
    format: 'jpg',
    imagemagick_stack: 'v3.0.1',
  },
  thumb_512_optimized: { robot: '/image/optimize', use: 'thumb_512' },

  thumb_1024: {
    robot: '/image/resize',
    use: 'imported',
    width: 1024,
    height: 1024,
    resize_strategy: 'fit',
    format: 'jpg',
    imagemagick_stack: 'v3.0.1',
  },
  thumb_1024_optimized: { robot: '/image/optimize', use: 'thumb_1024' },

  as_webp: {
    robot: '/image/resize',
    use: 'imported',
    width: 400,
    height: 400,
    resize_strategy: 'fit',
    format: 'webp',
    imagemagick_stack: 'v3.0.1',
  },
  as_webp_optimized: { robot: '/image/optimize', use: 'as_webp' },

  as_avif: {
    robot: '/image/resize',
    use: 'imported',
    width: 400,
    height: 400,
    resize_strategy: 'fit',
    format: 'avif',
    imagemagick_stack: 'v3.0.1',
  },
  as_avif_optimized: { robot: '/image/optimize', use: 'as_avif' },

  as_png: {
    robot: '/image/resize',
    use: 'imported',
    width: 400,
    height: 400,
    resize_strategy: 'fit',
    format: 'png',
    imagemagick_stack: 'v3.0.1',
  },
  as_png_optimized: { robot: '/image/optimize', use: 'as_png' },

  rotated: {
    robot: '/image/resize',
    use: 'imported',
    rotation: 90,
    format: 'jpg',
    imagemagick_stack: 'v3.0.1',
  },
  rotated_optimized: { robot: '/image/optimize', use: 'rotated' },

  blurred: {
    robot: '/image/resize',
    use: 'imported',
    width: 200,
    height: 200,
    blur: '5x5',
    format: 'jpg',
    imagemagick_stack: 'v3.0.1',
  },
  blurred_optimized: { robot: '/image/optimize', use: 'blurred' },
}

/**
 * Builds the inline Transloadit template POSTed to /assemblies for a Dropbox
 * background import.
 *
 * The `imported` step (/dropbox/import) pulls the files server-side, so it
 * stands in for the uploaded `:original` files of a normal Assembly.
 *
 * @param {{
 *   paths: ReadonlyArray<string>
 *   accessToken: string
 *   authKey: string
 *   steps?: Record<string, unknown>
 * }} args - `steps` selects the processing step-set; defaults to FULL_STEPS.
 * @returns {{
 *   auth: { key: string },
 *   emit_execution_progress: boolean,
 *   steps: Record<string, unknown>,
 * }} Assembly params ready for `POST /assemblies`.
 */
export function buildImportTemplate({
  paths,
  accessToken,
  authKey,
  steps = FULL_STEPS,
}) {
  return {
    auth: { key: authKey },
    // Opt in to SSE execution-progress events (`progress_combined`) — off by
    // default, so without this Transloadit emits no progress messages.
    emit_execution_progress: true,
    steps: {
      // Server-side import — stands in for the uploaded `:original` files.
      imported: {
        robot: '/dropbox/import',
        access_token: accessToken,
        path: [...paths],
      },
      ...steps,
    },
  }
}

// Inline icons for the example — no icon-font or emoji dependency.
//
//  - Stroke icons (Lucide geometry) inherit `currentColor`.
//  - Brand icons are the provider logos, ported from @uppy/components'
//    ProviderIcon (that package renders with Preact, so the SVG markup is
//    re-wrapped here as plain React components).

interface IconProps {
  size?: number
}

const STROKE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function FolderIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  )
}

export function FileIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function AlertCircleIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export function UploadIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export function CloseIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function GridIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function ListIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...STROKE} aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3.5" y1="6" x2="3.51" y2="6" />
      <line x1="3.5" y1="12" x2="3.51" y2="12" />
      <line x1="3.5" y1="18" x2="3.51" y2="18" />
    </svg>
  )
}

// --- Brand icons (multi-colour, fixed fills, 32×32 viewBox) ----------------

export function DeviceIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M8.45 22.087l-1.305-6.674h17.678l-1.572 6.674H8.45zm4.975-12.412l1.083 1.765a.823.823 0 00.715.386h7.951V13.5H8.587V9.675h4.838zM26.043 13.5h-1.195v-2.598c0-.463-.336-.75-.798-.75h-8.356l-1.082-1.766A.823.823 0 0013.897 8H7.728c-.462 0-.815.256-.815.718V13.5h-.956a.97.97 0 00-.746.37.972.972 0 00-.19.81l1.724 8.565c.095.44.484.755.933.755H24c.44 0 .824-.3.929-.727l2.043-8.568a.972.972 0 00-.176-.825.967.967 0 00-.753-.38z"
      />
    </svg>
  )
}

export function GoogleDriveIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <g fillRule="nonzero" fill="none">
        <path
          d="M6.663 22.284l.97 1.62c.202.34.492.609.832.804l3.465-5.798H5c0 .378.1.755.302 1.096l1.361 2.278z"
          fill="#0066DA"
        />
        <path
          d="M16 12.09l-3.465-5.798c-.34.195-.63.463-.832.804l-6.4 10.718A2.15 2.15 0 005 18.91h6.93L16 12.09z"
          fill="#00AC47"
        />
        <path
          d="M23.535 24.708c.34-.195.63-.463.832-.804l.403-.67 1.928-3.228c.201-.34.302-.718.302-1.096h-6.93l1.474 2.802 1.991 2.996z"
          fill="#EA4335"
        />
        <path
          d="M16 12.09l3.465-5.798A2.274 2.274 0 0018.331 6h-4.662c-.403 0-.794.11-1.134.292L16 12.09z"
          fill="#00832D"
        />
        <path
          d="M20.07 18.91h-8.14l-3.465 5.798c.34.195.73.292 1.134.292h12.802c.403 0 .794-.11 1.134-.292L20.07 18.91z"
          fill="#2684FC"
        />
        <path
          d="M23.497 12.455l-3.2-5.359a2.252 2.252 0 00-.832-.804L16 12.09l4.07 6.82h6.917c0-.377-.1-.755-.302-1.096l-3.188-5.359z"
          fill="#FFBA00"
        />
      </g>
    </svg>
  )
}

export function DropboxIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path
        d="M10.5 7.5L5 10.955l5.5 3.454 5.5-3.454 5.5 3.454 5.5-3.454L21.5 7.5 16 10.955zM10.5 21.319L5 17.864l5.5-3.455 5.5 3.455zM16 17.864l5.5-3.455 5.5 3.455-5.5 3.455zM16 25.925l-5.5-3.455 5.5-3.454 5.5 3.454z"
        fill="#0061FF"
        fillRule="nonzero"
      />
    </svg>
  )
}

export function OneDriveIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <g fill="none" fillRule="nonzero">
        <path
          d="M13.39 12.888l4.618 2.747 2.752-1.15a4.478 4.478 0 012.073-.352 6.858 6.858 0 00-5.527-5.04 6.895 6.895 0 00-6.876 2.982l.07-.002a5.5 5.5 0 012.89.815z"
          fill="#0364B8"
        />
        <path
          d="M13.39 12.887v.001a5.5 5.5 0 00-2.89-.815l-.07.002a5.502 5.502 0 00-4.822 2.964 5.43 5.43 0 00.38 5.62l4.073-1.702 1.81-.757 4.032-1.685 2.105-.88-4.619-2.748z"
          fill="#0078D4"
        />
        <path
          d="M22.833 14.133a4.479 4.479 0 00-2.073.352l-2.752 1.15.798.475 2.616 1.556 1.141.68 3.902 2.321a4.413 4.413 0 00-.022-4.25 4.471 4.471 0 00-3.61-2.284z"
          fill="#1490DF"
        />
        <path
          d="M22.563 18.346l-1.141-.68-2.616-1.556-.798-.475-2.105.88L11.87 18.2l-1.81.757-4.073 1.702A5.503 5.503 0 0010.5 23h12.031a4.472 4.472 0 003.934-2.333l-3.902-2.321z"
          fill="#28A8EA"
        />
      </g>
    </svg>
  )
}

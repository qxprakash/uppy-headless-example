import { useEffect, useState } from 'react'

// Shared "narrow screen" breakpoint — the file view switches to a grid here,
// and the upload paths collapse from side-by-side cards into tabs.
export const MOBILE_BREAKPOINT = '(max-width: 640px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

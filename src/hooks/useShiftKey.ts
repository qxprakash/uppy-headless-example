import { type RefObject, useEffect, useRef } from 'react'

/**
 * Tracks whether the Shift key is held *right now*, exposed as a ref so reading
 * it never triggers a re-render — it's read at the moment a checkbox changes.
 *
 * A checkbox `change` event carries no `shiftKey`, and tracking Shift globally
 * also makes keyboard (Space) range-selection work. This mirrors the approach
 * in `@uppy/provider-views`' Browser component.
 */
export function useShiftKey(): RefObject<boolean> {
  const pressed = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Shift') pressed.current = e.type === 'keydown'
    }
    // If the window loses focus mid-press, the keyup may never arrive — reset
    // so Shift can't get stuck "held".
    const onBlur = () => {
      pressed.current = false
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return pressed
}

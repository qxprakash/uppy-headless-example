import { type RefObject, useEffect } from 'react'

// Selector for elements that should receive Tab focus inside a modal.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Traps Tab / Shift+Tab focus inside the element pointed at by `ref`,
 * focuses the first focusable descendant on mount, and restores focus to
 * whatever element was focused before the trap activated when it unmounts.
 *
 * Implements the W3C dialog focus-management pattern with no dependencies.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = ref.current
    if (!root) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    const firstFocusable = focusables[0]
    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      // No focusable child — fall back to the container itself so Escape
      // still works and the screen reader announces the dialog.
      root.focus()
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return
      const items = Array.from(
        root!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey) {
        if (active === first || !root!.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [ref])
}

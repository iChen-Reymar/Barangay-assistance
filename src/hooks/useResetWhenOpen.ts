import { useState } from 'react'

/**
 * Re-initialises a modal's local form state from its props each time the modal
 * opens, or when the record it is editing changes.
 *
 * Form modals copy their props into state so the user can edit freely, which
 * means that copy has to be refreshed every time the modal is opened. Doing so
 * inside a useEffect makes React render once holding the previous record's
 * values and again with the new ones, so the old values can flash on screen and
 * every keystroke races against a re-render.
 *
 * Adjusting state during render - comparing against the previous prop and
 * updating before paint, as React's own guidance recommends - gets the same
 * result in a single render. The comparison below is what makes that legal:
 * React allows a component to update its own state while rendering, but only
 * when the update is conditional on a change like this one.
 *
 * @param open    Whether the modal is showing.
 * @param subject The record being edited. A change of identity restarts the
 *                form, so opening the modal for a different row never inherits
 *                the previous row's values.
 * @param reset   Applies the props to local state. Runs during render, so it
 *                must only set state - no side effects.
 */
export function useResetWhenOpen(open: boolean, subject: unknown, reset: () => void) {
  const [previous, setPrevious] = useState({ open, subject })

  if (previous.open !== open || previous.subject !== subject) {
    setPrevious({ open, subject })
    if (open) reset()
  }
}

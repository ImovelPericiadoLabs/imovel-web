import { hasAuthClientFlag } from '@/utils/auth-client-flag'

/** Event that opens the re-auth modal (handled by SessionMonitor). */
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'
/** Event emitted by SessionMonitor after a successful re-auth; resets the guard. */
export const AUTH_REAUTHENTICATED_EVENT = 'auth:reauthenticated'

let reauthPending = false
let resetListenerAttached = false

function attachResetListener() {
  if (resetListenerAttached || typeof window === 'undefined') return
  resetListenerAttached = true
  window.addEventListener(AUTH_REAUTHENTICATED_EVENT, () => {
    reauthPending = false
  })
}

/**
 * Opens the re-auth modal at most once per expired session. Ignores anonymous
 * 401s (no prior session) and de-dupes concurrent 401s; never signs out.
 */
export function requestReauth() {
  if (typeof window === 'undefined') return
  attachResetListener()
  if (!hasAuthClientFlag()) return
  if (reauthPending) return
  reauthPending = true
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
}

/** Resets the in-memory guard (after re-auth resolves or in tests). */
export function resetReauthGuard() {
  reauthPending = false
}

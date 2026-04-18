/** Marca que o cliente já obteve sessão NextAuth neste browser (localStorage). Usado para recuperar após falhas transitórias de rede. */
export const AUTH_CLIENT_ACTIVE_KEY = 'imovel:auth-client-active'

export function touchAuthClientFlag() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_CLIENT_ACTIVE_KEY, String(Date.now()))
    }
  } catch {
    // private mode / quota
  }
}

export function clearAuthClientFlag() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_CLIENT_ACTIVE_KEY)
    }
  } catch {
    // ignore
  }
}

export function hasAuthClientFlag() {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(AUTH_CLIENT_ACTIVE_KEY) != null
  } catch {
    return false
  }
}

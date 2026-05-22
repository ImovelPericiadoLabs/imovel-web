import { VSL_LOCAL_STORAGE_KEY } from '@/constants/onboarding'
import { getMe, markOnboardingVslSeen } from '@/services/account'

function readLocalVslSeen(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(VSL_LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeLocalVslSeen(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(VSL_LOCAL_STORAGE_KEY, 'true')
  } catch {
    /* ignore quota / private mode */
  }
}

export async function hasVslBeenSeen(): Promise<boolean> {
  if (readLocalVslSeen()) return true

  try {
    const me = await getMe()
    if (me?.onboarding_vsl_seen) {
      writeLocalVslSeen()
      return true
    }
  } catch {
    /* offline ou não autenticado */
  }

  return false
}

export async function persistVslSeen(): Promise<void> {
  writeLocalVslSeen()
  try {
    await markOnboardingVslSeen()
  } catch {
    /* API opcional para anônimos */
  }
}

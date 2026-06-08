import { useCallback, useSyncExternalStore } from 'react'
import {
  getDeferredInstallPrompt,
  isIosDevice,
  isPwaStandalone,
  subscribePwaInstall,
  triggerPwaInstall,
} from '../lib/pwaInstall'

function getSnapshot() {
  return {
    isStandalone: isPwaStandalone(),
    canInstall: getDeferredInstallPrompt() !== null,
    isIos: isIosDevice(),
  }
}

export function usePwaInstall() {
  const state = useSyncExternalStore(subscribePwaInstall, getSnapshot, getSnapshot)

  const install = useCallback(async () => {
    return triggerPwaInstall()
  }, [])

  return {
    ...state,
    install,
    showInstallUi: !state.isStandalone,
  }
}

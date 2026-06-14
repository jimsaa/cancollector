import { useCallback, useSyncExternalStore } from 'react'

import {

  getDeferredInstallPrompt,

  isIosDevice,

  isPwaStandalone,

  subscribePwaInstall,

  triggerPwaInstall,

} from '../lib/pwaInstall'



interface PwaInstallSnapshot {

  isStandalone: boolean

  canInstall: boolean

  isIos: boolean

}



let cachedSnapshot: PwaInstallSnapshot = {

  isStandalone: false,

  canInstall: false,

  isIos: false,

}



function getSnapshot(): PwaInstallSnapshot {

  const next: PwaInstallSnapshot = {

    isStandalone: isPwaStandalone(),

    canInstall: getDeferredInstallPrompt() !== null,

    isIos: isIosDevice(),

  }



  if (

    cachedSnapshot.isStandalone !== next.isStandalone ||

    cachedSnapshot.canInstall !== next.canInstall ||

    cachedSnapshot.isIos !== next.isIos

  ) {

    cachedSnapshot = next

  }



  return cachedSnapshot

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



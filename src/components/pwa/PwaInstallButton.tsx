import { useState } from 'react'
import { Download } from 'lucide-react'
import { APP_NAME } from '../../constants/branding'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { InstallInstructionsModal } from './InstallInstructionsModal'

export function PwaInstallButton() {
  const { showInstallUi, canInstall, isIos, install } = usePwaInstall()
  const [showInstructions, setShowInstructions] = useState(false)

  if (!showInstallUi) return null

  const handleClick = async () => {
    if (canInstall) {
      const outcome = await install()
      if (outcome === 'unavailable') {
        setShowInstructions(true)
      }
      return
    }
    setShowInstructions(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className="inline-flex items-center gap-1 rounded-full border border-monster-green/40 bg-monster-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-monster-green transition-colors hover:bg-monster-green/20"
        title={`Install ${APP_NAME} app`}
        aria-label={`Download ${APP_NAME} app`}
      >
        <Download size={12} />
        Install App
      </button>

      <InstallInstructionsModal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        isIos={isIos}
      />
    </>
  )
}

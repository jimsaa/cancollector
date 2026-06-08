import { Search, Camera, CameraOff, Keyboard } from 'lucide-react'
import { BarcodeScanner } from '../scanner/BarcodeScanner'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import type { CameraErrorInfo } from '../../lib/cameraErrors'

interface AddCanStepScanProps {
  scanning: boolean
  lookupLoading: boolean
  manualBarcode: string
  cameraAvailable: boolean
  cameraError: CameraErrorInfo | null
  onManualBarcodeChange: (value: string) => void
  onStartScan: () => void
  onStopScan: () => void
  onManualLookup: () => void
  onScan: (barcode: string) => void
  onCameraError: (error: CameraErrorInfo | null) => void
  onScanningChange: (scanning: boolean) => void
}

export function AddCanStepScan({
  scanning,
  lookupLoading,
  manualBarcode,
  cameraAvailable,
  cameraError,
  onManualBarcodeChange,
  onStartScan,
  onStopScan,
  onManualLookup,
  onScan,
  onCameraError,
  onScanningChange,
}: AddCanStepScanProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-monster-muted">
        Scan a barcode with your camera or type one manually to look up product data.
      </p>

      <section className="flex flex-col gap-3">
        <BarcodeScanner
          active={scanning}
          onScan={onScan}
          onError={onCameraError}
          onScanningChange={onScanningChange}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            onClick={onStartScan}
            disabled={scanning || lookupLoading || !cameraAvailable}
            className="py-3.5"
          >
            <Camera size={20} />
            Start Scan
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onStopScan}
            disabled={!scanning}
            className="py-3.5"
          >
            <CameraOff size={20} />
            Stop Scan
          </Button>
        </div>

        {!cameraAvailable ? (
          <Card className="border-yellow-600/40 bg-yellow-900/20">
            <p className="text-sm font-semibold text-yellow-300">Camera unavailable</p>
            <p className="mt-1 text-xs text-monster-muted">Use manual barcode entry below.</p>
          </Card>
        ) : null}

        {cameraError ? (
          <Card className="border-red-800/50 bg-red-950/30">
            <p className="text-sm font-semibold text-red-300">{cameraError.title}</p>
            <p className="mt-1 text-xs text-monster-muted">{cameraError.message}</p>
          </Card>
        ) : null}
      </section>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Keyboard size={16} className="text-monster-green" />
          <p className="text-xs font-medium uppercase tracking-wide text-monster-muted">
            Manual Barcode Entry
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 5053947891234"
            value={manualBarcode}
            onChange={(e) => onManualBarcodeChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onManualLookup()}
            inputMode="numeric"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={onManualLookup}
            loading={lookupLoading}
            disabled={!manualBarcode.trim()}
            className="shrink-0"
            aria-label="Look up barcode"
          >
            <Search size={18} />
          </Button>
        </div>
      </Card>

      {lookupLoading ? (
        <LoadingSpinner label="Checking CanTrove Master Database..." />
      ) : null}
    </div>
  )
}

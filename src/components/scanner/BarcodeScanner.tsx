import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { Camera, CameraOff, ScanLine } from 'lucide-react'
import type { CameraErrorInfo } from '../../lib/cameraErrors'
import { getCameraErrorInfo, isCameraSupported, isSecureContext } from '../../lib/cameraErrors'
import { buildRearCameraConstraints, getRearCameraDeviceId } from '../../lib/cameraDevice'

interface BarcodeScannerProps {
  active: boolean
  onScan: (barcode: string) => void
  onError?: (error: CameraErrorInfo) => void
  onScanningChange?: (scanning: boolean) => void
}

export function BarcodeScanner({ active, onScan, onError, onScanningChange }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  const onScanningChangeRef = useRef(onScanningChange)
  const scannedRef = useRef(false)

  const [isLive, setIsLive] = useState(false)
  const [localError, setLocalError] = useState<CameraErrorInfo | null>(null)

  onScanRef.current = onScan
  onErrorRef.current = onError
  onScanningChangeRef.current = onScanningChange

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setIsLive(false)
    onScanningChangeRef.current?.(false)
  }, [])

  useEffect(() => {
    if (!active) {
      stopCamera()
      scannedRef.current = false
      return
    }

    if (!isSecureContext()) {
      const info = getCameraErrorInfo(new DOMException('Insecure context', 'SecurityError'))
      setLocalError(info)
      onErrorRef.current?.(info)
      return
    }

    if (!isCameraSupported()) {
      const info = getCameraErrorInfo(new Error('Camera API not supported'))
      setLocalError(info)
      onErrorRef.current?.(info)
      return
    }

    scannedRef.current = false
    setLocalError(null)

    const reader = new BrowserMultiFormatReader()
    let cancelled = false

    const start = async () => {
      try {
        onScanningChangeRef.current?.(true)

        const deviceId = await getRearCameraDeviceId()
        if (cancelled || !videoRef.current) return

        const handleResult: Parameters<typeof reader.decodeFromVideoDevice>[2] = (result) => {
          if (result && !scannedRef.current) {
            scannedRef.current = true
            stopCamera()
            onScanRef.current(result.getText())
          }
        }

        const controls = deviceId
          ? await reader.decodeFromVideoDevice(deviceId, videoRef.current, handleResult)
          : await reader.decodeFromConstraints(
              buildRearCameraConstraints(),
              videoRef.current,
              handleResult,
            )

        if (cancelled) {
          controls.stop()
          return
        }

        controlsRef.current = controls
        setIsLive(true)
      } catch (err) {
        if (cancelled) return
        const info = getCameraErrorInfo(err)
        setLocalError(info)
        onErrorRef.current?.(info)
        stopCamera()
      }
    }

    start()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [active, stopCamera])

  return (
    <div className="overflow-hidden rounded-2xl border border-monster-border bg-black">
      <div className="relative aspect-[4/3] w-full bg-monster-dark">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${isLive ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          autoPlay
        />

        {!isLive && !localError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-monster-card">
              <CameraOff size={28} className="text-monster-muted" />
            </div>
            <p className="text-sm font-medium text-white">Camera preview</p>
            <p className="text-xs text-monster-muted">
              Tap <span className="text-monster-green">Start Scan</span> to use your rear camera
            </p>
          </div>
        ) : null}

        {isLive ? (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-36 w-56 rounded-lg border-2 border-monster-green shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-monster-green/60" />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs text-monster-green">
                <ScanLine size={14} className="animate-pulse" />
                Scanning…
              </span>
            </div>
          </>
        ) : null}

        {localError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-monster-dark/95 px-6 text-center">
            <Camera size={28} className="text-red-400" />
            <p className="text-sm font-semibold text-red-300">{localError.title}</p>
            <p className="text-xs text-monster-muted">{localError.message}</p>
          </div>
        ) : null}
      </div>

      {isLive ? (
        <div className="flex items-center justify-center gap-2 border-t border-monster-border p-3">
          <Camera size={16} className="animate-pulse text-monster-green" />
          <p className="text-xs text-monster-muted">Align the barcode inside the frame</p>
        </div>
      ) : null}
    </div>
  )
}

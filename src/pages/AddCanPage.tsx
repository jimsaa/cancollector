import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Camera, CameraOff, Keyboard } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { BarcodeScanner } from '../components/scanner/BarcodeScanner'
import { ScanConfirmScreen, type LookupStatus } from '../components/scanner/ScanConfirmScreen'
import { DuplicateCanScreen } from '../components/cans/DuplicateCanScreen'
import { CanFormFields, emptyFormData, formDataToInsert, type CanFormData } from '../components/cans/CanForm'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { fetchProductByBarcode } from '../lib/openFoodFacts'
import { uploadCanImage } from '../lib/storage'
import { findDuplicateCan } from '../lib/duplicates'
import type { CameraErrorInfo } from '../lib/cameraErrors'
import { isCameraSupported, isSecureContext } from '../lib/cameraErrors'
import type { Can } from '../types/can'

type AddStep = 'scan' | 'confirm' | 'edit' | 'duplicate'

export function AddCanPage() {
  const { user } = useAuth()
  const { cans, add, update } = useCans(user?.id)
  const navigate = useNavigate()

  const [step, setStep] = useState<AddStep>('scan')
  const [scanning, setScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [form, setForm] = useState<CanFormData>(emptyFormData())
  const [duplicate, setDuplicate] = useState<Can | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('not_found')
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const cameraAvailable = isSecureContext() && isCameraSupported()
  const collectionCans = cans.filter((c) => !c.is_wishlist)

  const resetToScan = useCallback(() => {
    setStep('scan')
    setScanning(false)
    setLookupLoading(false)
    setSaveError(null)
    setCameraError(null)
    setForm(emptyFormData())
    setDuplicate(null)
    setManualBarcode('')
    setLookupStatus('not_found')
  }, [])

  const checkDuplicate = useCallback(
    (barcode: string, country: string, countryVariant: string) => {
      const match = findDuplicateCan(collectionCans, barcode, country, countryVariant)
      if (match) {
        setDuplicate(match)
        setStep('duplicate')
        return true
      }
      return false
    },
    [collectionCans],
  )

  const applyProduct = useCallback(
    async (barcode: string) => {
      setLookupLoading(true)
      setSaveError(null)
      setScanning(false)
      setDuplicate(null)

      try {
        const product = await fetchProductByBarcode(barcode)
        const nextForm: CanFormData = {
          ...emptyFormData(),
          barcode,
          name: product?.name ?? '',
          brand: product?.brand ?? 'Monster',
          flavor: product?.flavor ?? '',
          volume: product?.volume ?? '',
          country: product?.country ?? '',
          image_url: product?.image_url ?? '',
        }
        setForm(nextForm)
        setLookupStatus(product ? 'found' : 'not_found')

        if (checkDuplicate(barcode, nextForm.country, nextForm.country_variant)) {
          return
        }
        setStep('confirm')
      } catch {
        const nextForm = { ...emptyFormData(), barcode }
        setForm(nextForm)
        setLookupStatus('error')
        if (checkDuplicate(barcode, '', '')) return
        setStep('confirm')
      } finally {
        setLookupLoading(false)
      }
    },
    [checkDuplicate],
  )

  const handleScan = useCallback(
    (barcode: string) => {
      setManualBarcode(barcode)
      setScanning(false)
      applyProduct(barcode)
    },
    [applyProduct],
  )

  const handleManualLookup = () => {
    const code = manualBarcode.trim()
    if (!code) return
    setScanning(false)
    applyProduct(code)
  }

  const handleSave = async () => {
    if (checkDuplicate(form.barcode, form.country, form.country_variant)) return

    setSaveLoading(true)
    setSaveError(null)
    try {
      const created = await add(formDataToInsert(form))
      navigate(`/can/${created.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save can')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleIncreaseQuantity = async () => {
    if (!duplicate) return
    setSaveLoading(true)
    setSaveError(null)
    try {
      const updated = await update(duplicate.id, { quantity: duplicate.quantity + 1 })
      navigate(`/can/${updated.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update quantity')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleAddAsNewVariant = () => {
    setDuplicate(null)
    setStep('edit')
  }

  return (
    <Layout title="Add Can">
      <div className="flex flex-col gap-5">
        {step === 'scan' ? (
          <>
            <section className="flex flex-col gap-3">
              <BarcodeScanner
                active={scanning}
                onScan={handleScan}
                onError={setCameraError}
                onScanningChange={setScanning}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => { setCameraError(null); setScanning(true) }}
                  disabled={scanning || lookupLoading || !cameraAvailable}
                  className="py-3.5"
                >
                  <Camera size={20} />
                  Start Scan
                </Button>
                <Button type="button" variant="secondary" onClick={() => setScanning(false)} disabled={!scanning} className="py-3.5">
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
                <p className="text-xs font-medium uppercase tracking-wide text-monster-muted">Manual Barcode Entry</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 5053947891234"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                  inputMode="numeric"
                />
                <Button type="button" variant="secondary" onClick={handleManualLookup} loading={lookupLoading} disabled={!manualBarcode.trim()} className="shrink-0" aria-label="Look up barcode">
                  <Search size={18} />
                </Button>
              </div>
            </Card>
            {lookupLoading ? <LoadingSpinner label="Fetching product from Open Food Facts..." /> : null}
          </>
        ) : null}

        {step === 'duplicate' && duplicate ? (
          <DuplicateCanScreen
            existing={duplicate}
            increasing={saveLoading}
            error={saveError}
            onIncreaseQuantity={handleIncreaseQuantity}
            onAddAsNewVariant={handleAddAsNewVariant}
            onScanAgain={resetToScan}
          />
        ) : null}

        {step === 'confirm' ? (
          <ScanConfirmScreen
            data={form}
            lookupStatus={lookupStatus}
            saving={saveLoading}
            saveError={saveError}
            onEdit={() => setStep('edit')}
            onSave={handleSave}
            onScanAgain={resetToScan}
          />
        ) : null}

        {step === 'edit' ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Edit can details</p>
              <button type="button" onClick={() => setStep(duplicate ? 'duplicate' : 'confirm')} className="text-xs text-monster-green hover:underline">
                Back to review
              </button>
            </div>
            <CanFormFields data={form} onChange={setForm} onImageUpload={async (file) => {
              if (!user) return
              setUploading(true)
              try {
                const url = await uploadCanImage(user.id, file)
                setForm((prev) => ({ ...prev, image_url: url }))
              } finally {
                setUploading(false)
              }
            }} uploading={uploading} />
            {saveError ? <p className="text-sm text-red-400">{saveError}</p> : null}
            <Button fullWidth loading={saveLoading} onClick={handleSave} className="py-4">Confirm & Save to Collection</Button>
            <Button variant="ghost" fullWidth onClick={resetToScan}>Scan Another Can</Button>
          </>
        ) : null}
      </div>
    </Layout>
  )
}

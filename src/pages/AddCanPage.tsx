import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatSaveCanError, logSaveCanError } from '../lib/canSupabase'
import { Layout } from '../components/layout/Layout'
import { DuplicateCanScreen } from '../components/cans/DuplicateCanScreen'
import {
  applyAutoImageToForm,
  emptyFormData,
  formDataToInsert,
  type CanFormData,
} from '../components/cans/CanForm'
import {
  AddCanWizardProgress,
  type AddCanWizardStep,
} from '../components/addCan/AddCanWizardProgress'
import { AddCanStepScan } from '../components/addCan/AddCanStepScan'
import { AddCanStepMatch } from '../components/addCan/AddCanStepMatch'
import { AddCanStepEdit } from '../components/addCan/AddCanStepEdit'
import { AddCanStepSummary } from '../components/addCan/AddCanStepSummary'
import { useAuth } from '../hooks/useAuth'
import { useGuestMessaging } from '../hooks/useGuestMessaging'
import { useCans } from '../hooks/useCans'
import { useCanImageUpload } from '../hooks/useCanImageUpload'
import { findDuplicateCan } from '../lib/duplicates'
import { fetchActiveMasterCans } from '../lib/masterCans'
import { attachMasterCanLink } from '../lib/masterCanMatching'
import { lookupBarcodeProduct, type OffLookupStatus } from '../lib/scanProductLookup'
import { getSaveImageFields } from '../lib/canImage'
import { inferSuggestionSource, maybeCreatePendingSuggestion } from '../lib/pendingSuggestions'
import { useGuestStorage } from '../lib/guestStorage'
import { isCameraSupported, isSecureContext } from '../lib/cameraErrors'
import type { CameraErrorInfo } from '../lib/cameraErrors'
import type { Can } from '../types/can'
import type { MasterCan } from '../types/masterCan'

type PageStep = AddCanWizardStep | 'duplicate'

export function AddCanPage() {
  const { storageUserId, user, isCloudSynced } = useAuth()
  const { triggerRegisterCTA } = useGuestMessaging()
  const { cans, add, update } = useCans(storageUserId)
  const navigate = useNavigate()
  const imageUpload = useCanImageUpload(storageUserId)

  const [step, setStep] = useState<PageStep>('scan')
  const [scanning, setScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [form, setForm] = useState<CanFormData>(emptyFormData())
  const [matchedMaster, setMatchedMaster] = useState<MasterCan | null>(null)
  const [duplicate, setDuplicate] = useState<Can | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [offStatus, setOffStatus] = useState<OffLookupStatus>('skipped')
  const [primarySource, setPrimarySource] = useState<'master_database' | 'open_food_facts' | 'none'>('none')
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const cameraAvailable = isSecureContext() && isCameraSupported()
  const collectionCans = cans.filter((c) => !c.is_wishlist)

  const resetToScan = useCallback(() => {
    setStep('scan')
    setScanning(false)
    setLookupLoading(false)
    setSaveError(null)
    setCameraError(null)
    setForm(emptyFormData())
    setMatchedMaster(null)
    setDuplicate(null)
    setManualBarcode('')
    setOffStatus('skipped')
    setPrimarySource('none')
    imageUpload.clearUploadState()
  }, [imageUpload])

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
      imageUpload.clearUploadState()

      try {
        const result = await lookupBarcodeProduct(barcode, emptyFormData)

        setMatchedMaster(result.master)
        setForm(result.form)
        setOffStatus(result.offStatus)
        setPrimarySource(result.primarySource)

        const nextForm = result.form

        if (checkDuplicate(barcode, nextForm.country, nextForm.country_variant)) {
          return
        }

        setStep('match')
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AddCan] Barcode lookup failed', { barcode, err })
        }
        const nextForm = { ...emptyFormData(), barcode }
        setForm(nextForm)
        setMatchedMaster(null)
        setOffStatus('error')
        setPrimarySource('none')

        if (checkDuplicate(barcode, '', '')) return

        setStep('match')
      } finally {
        setLookupLoading(false)
      }
    },
    [checkDuplicate, imageUpload],
  )

  const handleScan = useCallback(
    (barcode: string) => {
      setManualBarcode(barcode)
      setScanning(false)
      void applyProduct(barcode)
    },
    [applyProduct],
  )

  const handleManualLookup = () => {
    const code = manualBarcode.trim()
    if (!code) return
    setScanning(false)
    void applyProduct(code)
  }

  const handleImageFile = async (file: File) => {
    try {
      const url = await imageUpload.processFile(file)
      setForm((prev) => ({ ...prev, user_image_url: url, image_source: 'user' as const }))
    } catch {
      // error shown via imageUpload.uploadError
    }
  }

  const handleImageRemove = () => {
    imageUpload.clearUploadState()
    setForm((prev) => applyAutoImageToForm({ ...prev, user_image_url: '' }))
  }

  const handleSave = async () => {
    if (checkDuplicate(form.barcode, form.country, form.country_variant)) return

    setSaveLoading(true)
    setSaveError(null)
    imageUpload.setUploadError(null)

    try {
      let insert = formDataToInsert(form)
      try {
        const masters = await fetchActiveMasterCans('all')
        insert = attachMasterCanLink(insert, masters)
      } catch (linkErr) {
        logSaveCanError(linkErr, { operation: 'master_can_link', barcode: form.barcode })
      }
      const created = await add(insert)

      if (!insert.is_wishlist) {
        const collectionCount = cans.filter((c) => !c.is_wishlist).length + 1
        if (collectionCount === 1) triggerRegisterCTA('first_can')
        if (collectionCount === 3) triggerRegisterCTA('three_cans')
      }

      const hasPendingUpload =
        !useGuestStorage() &&
        (imageUpload.pendingBlob || form.user_image_url.startsWith('data:'))

      if (hasPendingUpload) {
        try {
          const cloudUrl = await imageUpload.uploadPendingForCan(created.id, form.user_image_url)
          if (cloudUrl) {
            await update(
              created.id,
              getSaveImageFields({
                ...form,
                user_image_url: cloudUrl,
                image_source: 'user',
              }),
            )
          }
        } catch (err) {
          setSaveError(
            `Can saved, but image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}. You can retry from the can detail page.`,
          )
          navigate(`/can/${created.id}`)
          return
        }
      } else if (
        !useGuestStorage() &&
        form.user_image_url &&
        !form.user_image_url.startsWith('data:') &&
        form.image_source === 'user'
      ) {
        await update(created.id, getSaveImageFields(form))
      }

      if (!insert.master_can_id && insert.barcode) {
        const imageUrl =
          form.image_source === 'user'
            ? form.user_image_url
            : form.master_image_url || form.off_image_url || null
        await maybeCreatePendingSuggestion({
          barcode: insert.barcode,
          product_name: insert.name,
          image_url: imageUrl,
          source: inferSuggestionSource({
            offFound: offStatus === 'found',
            hasUserImage: form.image_source === 'user' && Boolean(form.user_image_url),
          }),
          submitted_by: storageUserId,
        }).catch(() => undefined)
      }

      const savedName = created.name || form.name || 'Can'
      navigate('/collection', {
        replace: true,
        state: { saveToast: `"${savedName}" added to your collection` },
      })
    } catch (err) {
      logSaveCanError(err, {
        barcode: form.barcode,
        userId: isCloudSynced ? user?.id : storageUserId,
        isCloudSynced,
      })
      setSaveError(formatSaveCanError(err))
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

  const wizardStep: AddCanWizardStep | null =
    step === 'duplicate' ? null : (step as AddCanWizardStep)

  return (
    <Layout title="Add Can">
      <div className="flex flex-col gap-4">
        {wizardStep ? <AddCanWizardProgress current={wizardStep} /> : null}

        {step === 'scan' ? (
          <AddCanStepScan
            scanning={scanning}
            lookupLoading={lookupLoading}
            manualBarcode={manualBarcode}
            cameraAvailable={cameraAvailable}
            cameraError={cameraError}
            onManualBarcodeChange={setManualBarcode}
            onStartScan={() => {
              setCameraError(null)
              setScanning(true)
            }}
            onStopScan={() => setScanning(false)}
            onManualLookup={handleManualLookup}
            onScan={handleScan}
            onCameraError={setCameraError}
            onScanningChange={setScanning}
          />
        ) : null}

        {step === 'match' ? (
          <AddCanStepMatch
            data={form}
            offStatus={offStatus}
            primarySource={primarySource}
            matchedMaster={matchedMaster}
            onBack={resetToScan}
            onContinue={() => setStep('edit')}
            onEdit={() => setStep('edit')}
          />
        ) : null}

        {step === 'edit' ? (
          <AddCanStepEdit
            data={form}
            onChange={setForm}
            onBack={() => setStep('match')}
            onContinue={() => setStep('summary')}
            onImageFileSelect={handleImageFile}
            onImageRemove={handleImageRemove}
            imageUploading={imageUpload.uploading}
            imageUploadError={imageUpload.uploadError}
            imageSizeWarning={imageUpload.sizeWarning}
          />
        ) : null}

        {step === 'summary' ? (
          <AddCanStepSummary
            data={form}
            saving={saveLoading}
            saveError={saveError}
            onBack={() => setStep('edit')}
            onSave={() => void handleSave()}
          />
        ) : null}

        {step === 'duplicate' && duplicate ? (
          <DuplicateCanScreen
            existing={duplicate}
            increasing={saveLoading}
            error={saveError}
            onIncreaseQuantity={() => void handleIncreaseQuantity()}
            onAddAsNewVariant={handleAddAsNewVariant}
            onScanAgain={resetToScan}
          />
        ) : null}
      </div>
    </Layout>
  )
}

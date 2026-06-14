import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Check, ImageIcon, Lock, ScanLine, Search, Shield, Upload } from 'lucide-react'
import { AdminHubNav } from '../components/admin/AdminHubNav'
import { BarcodeScanner } from '../components/scanner/BarcodeScanner'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import {
  activateLocalAdminSession,
  getAdminAccessState,
  getAdminPin,
} from '../lib/adminAuth'
import { fetchActiveMasterCans } from '../lib/masterCans'
import { getMasterReferenceImageUrl } from '../lib/masterReferenceImage'
import {
  createAdminMasterCan,
  lookupMasterCanByBarcode,
  saveApprovedAdminReferenceImage,
  searchMasterCansByQuery,
  uploadMasterReferenceImageFile,
} from '../lib/masterImageUploader'
import { MASTER_IMAGE_SOURCE_LABELS } from '../types/masterImageSource'
import { REFERENCE_IMAGE_STATUS_LABELS } from '../types/referenceImageStatus'
import type { MasterCan } from '../types/masterCan'

function resetPreview(previewUrl: string | null) {
  if (previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl)
  }
}

export function AdminMasterImageUploaderPage() {
  const { profile, user, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [localAdmin, setLocalAdmin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  const [masters, setMasters] = useState<MasterCan[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)

  const [barcode, setBarcode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)

  const [selected, setSelected] = useState<MasterCan | null>(null)
  const [createMode, setCreateMode] = useState(false)
  const [newBrand, setNewBrand] = useState('Monster')
  const [newProductName, setNewProductName] = useState('')
  const [newFlavor, setNewFlavor] = useState('')
  const [newBarcode, setNewBarcode] = useState('')

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const access = getAdminAccessState({
    loading: authLoading,
    isGuest,
    isConfigured,
    profile,
  })
  const granted = access === 'granted' || (access === 'pin_required' && localAdmin)

  const loadCatalog = useCallback(async () => {
    if (!granted) return
    setCatalogLoading(true)
    try {
      setMasters(await fetchActiveMasterCans('all'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load master catalog')
    } finally {
      setCatalogLoading(false)
    }
  }, [granted])

  useEffect(() => {
    if (granted) void loadCatalog()
  }, [granted, loadCatalog])

  useEffect(() => {
    return () => resetPreview(previewUrl)
  }, [previewUrl])

  const searchResults = useMemo(
    () => searchMasterCansByQuery(masters, searchQuery),
    [masters, searchQuery],
  )

  const clearUploadPreview = () => {
    resetPreview(previewUrl)
    setPreviewUrl(null)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForNextScan = () => {
    clearUploadPreview()
    setSelected(null)
    setCreateMode(false)
    setBarcode('')
    setSearchQuery('')
    setNewProductName('')
    setNewFlavor('')
    setNewBarcode('')
    setScannerActive(false)
    setError(null)
  }

  const selectMaster = (master: MasterCan) => {
    clearUploadPreview()
    setCreateMode(false)
    setSelected(master)
    setSuccess(null)
    setError(null)
  }

  const startCreate = (prefillBarcode?: string) => {
    clearUploadPreview()
    setSelected(null)
    setCreateMode(true)
    setNewBarcode(prefillBarcode ?? barcode.trim())
    setNewProductName(searchQuery.trim())
    setSuccess(null)
    setError(null)
  }

  const handleBarcodeLookup = async (code?: string) => {
    const value = (code ?? barcode).trim()
    if (!value) {
      setError('Enter a barcode to look up')
      return
    }
    setLookupLoading(true)
    setError(null)
    setSuccess(null)
    setScannerActive(false)
    try {
      const found = await lookupMasterCanByBarcode(value)
      if (found) {
        selectMaster(found)
        setSuccess(`Loaded ${found.product_name}`)
      } else {
        startCreate(value)
        setSuccess('No master can found — fill in details to create one')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Barcode lookup failed')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleCreateMaster = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const created = await createAdminMasterCan({
        brand: newBrand,
        product_name: newProductName,
        flavor: newFlavor || null,
        barcode: newBarcode || null,
      })
      selectMaster(created)
      setCreateMode(false)
      setSuccess(`Created master can: ${created.product_name}`)
      await loadCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create master can')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (file: File | null) => {
    clearUploadPreview()
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  const handleSave = async (scanNext: boolean) => {
    if (!selected) {
      setError('Select or create a master can first')
      return
    }
    if (!pendingFile) {
      setError('Choose a reference image to upload')
      return
    }
    const adminId = user?.id ?? 'local-admin'
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const uploadedUrl = await uploadMasterReferenceImageFile(adminId, selected.id, pendingFile)
      const updated = await saveApprovedAdminReferenceImage(selected, uploadedUrl)
      setSelected(updated)
      setSuccess(
        scanNext
          ? `Saved approved reference for ${updated.product_name}. Ready for next scan.`
          : `Saved approved reference image for ${updated.product_name}.`,
      )
      clearUploadPreview()
      await loadCatalog()
      if (scanNext) resetForNextScan()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleLocalLogin = () => {
    if (activateLocalAdminSession(pin)) {
      setLocalAdmin(true)
      setPinError(null)
    } else {
      setPinError('Invalid admin PIN')
    }
  }

  if (authLoading) {
    return (
      <Layout title="Master Image Uploader">
        <LoadingSpinner label="Checking access..." />
      </Layout>
    )
  }

  if (access === 'denied') {
    return (
      <Layout title="Master Image Uploader">
        <EmptyState
          icon={<Lock size={40} />}
          title="Access denied"
          description="Only admin accounts can upload master reference images."
          action={
            <Link to="/admin">
              <Button>Admin dashboard</Button>
            </Link>
          }
        />
      </Layout>
    )
  }

  if (access === 'pin_required' && !localAdmin) {
    return (
      <Layout title="Master Image Uploader">
        <Card className="mx-auto max-w-sm p-4">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={20} className="text-monster-green" />
            <p className="font-semibold text-white">Local Admin Simulation</p>
          </div>
          <Input
            label="Admin PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLocalLogin()}
          />
          {pinError ? <p className="mt-2 text-sm text-red-400">{pinError}</p> : null}
          <Button fullWidth className="mt-4" onClick={handleLocalLogin}>
            <Lock size={18} />
            Enter Admin
          </Button>
          <p className="mt-3 text-center text-xs text-monster-muted">
            Default PIN: <code className="text-monster-green">{getAdminPin()}</code>
          </p>
        </Card>
      </Layout>
    )
  }

  const currentReference = selected ? getMasterReferenceImageUrl(selected) : null

  return (
    <Layout title="Master Image Uploader">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Upload size={22} className="mt-0.5 shrink-0 text-monster-green" />
          <div>
            <p className="text-sm font-semibold text-white">Master Image Uploader</p>
            <p className="text-xs text-monster-muted">
              Scan or search, upload a clean reference image, and save as approved catalog art.
            </p>
          </div>
        </div>

        <AdminHubNav />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-monster-green">{success}</p> : null}
        {catalogLoading ? <LoadingSpinner label="Loading master catalog..." /> : null}

        {!selected && !createMode ? (
          <>
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold text-white">Find master can</p>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-monster-muted">
                    <ScanLine size={14} />
                    Barcode
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      label="Barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="7350150861178"
                      onKeyDown={(e) => e.key === 'Enter' && void handleBarcodeLookup()}
                    />
                    <div className="flex gap-2 sm:items-end">
                      <Button
                        className="whitespace-nowrap"
                        loading={lookupLoading}
                        onClick={() => void handleBarcodeLookup()}
                      >
                        Look up
                      </Button>
                      <Button
                        variant="secondary"
                        className="whitespace-nowrap"
                        onClick={() => setScannerActive((v) => !v)}
                      >
                        <Camera size={16} />
                        {scannerActive ? 'Hide scanner' : 'Scan'}
                      </Button>
                    </div>
                  </div>
                  {scannerActive ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-monster-border">
                      <BarcodeScanner
                        active={scannerActive}
                        onScan={(code) => {
                          setBarcode(code)
                          void handleBarcodeLookup(code)
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-monster-border pt-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-monster-muted">
                    <Search size={14} />
                    Product name
                  </p>
                  <Input
                    label="Search product name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ultra Black"
                  />
                  {searchQuery.trim() ? (
                    <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                      {searchResults.length ? (
                        searchResults.map((row) => (
                          <li key={row.id}>
                            <button
                              type="button"
                              onClick={() => selectMaster(row)}
                              className="w-full rounded-xl border border-monster-border bg-monster-dark px-3 py-2 text-left transition-colors hover:border-monster-green/50"
                            >
                              <p className="text-sm font-semibold text-white">{row.product_name}</p>
                              <p className="text-xs text-monster-muted">
                                {row.brand}
                                {row.flavor ? ` · ${row.flavor}` : ''}
                                {row.barcode ? ` · ${row.barcode}` : ''}
                              </p>
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-monster-muted">No matches — create a new master can below.</li>
                      )}
                    </ul>
                  ) : null}
                </div>

                <Button variant="secondary" onClick={() => startCreate()}>
                  Create new master can
                </Button>
              </div>
            </Card>
          </>
        ) : null}

        {createMode ? (
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold text-white">Create master can</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Brand" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
              <Input
                label="Product name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />
              <Input label="Flavor" value={newFlavor} onChange={(e) => setNewFlavor(e.target.value)} />
              <Input label="Barcode" value={newBarcode} onChange={(e) => setNewBarcode(e.target.value)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button loading={saving} onClick={() => void handleCreateMaster()}>
                Create & continue
              </Button>
              <Button variant="secondary" onClick={() => setCreateMode(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        ) : null}

        {selected ? (
          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{selected.product_name}</p>
                <p className="text-sm text-monster-muted">
                  {selected.brand}
                  {selected.flavor ? ` · ${selected.flavor}` : ''}
                </p>
                <p className="mt-1 font-mono text-xs text-monster-muted">
                  {selected.barcode ?? 'No barcode'}
                </p>
                <p className="mt-1 text-xs text-monster-muted">
                  Status: {REFERENCE_IMAGE_STATUS_LABELS[selected.reference_image_status]}
                  {selected.image_source
                    ? ` · ${MASTER_IMAGE_SOURCE_LABELS[selected.image_source]}`
                    : ''}
                </p>
              </div>
              <Button variant="secondary" className="text-xs" onClick={resetForNextScan}>
                Change product
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
                  Current reference
                </p>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-monster-border bg-monster-dark">
                  {currentReference ? (
                    <img src={currentReference} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-monster-muted">
                      <ImageIcon size={32} />
                      <span className="text-xs">No reference image</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
                  New upload preview
                </p>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-monster-green/30 bg-monster-dark">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 text-center text-monster-muted">
                      <Upload size={32} />
                      <span className="text-xs">Choose an image to preview before saving</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                Choose reference image
              </Button>
              {pendingFile ? (
                <p className="mt-2 text-xs text-monster-muted">{pendingFile.name}</p>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                loading={saving}
                disabled={!pendingFile}
                onClick={() => void handleSave(false)}
              >
                <Check size={16} />
                Save approved reference
              </Button>
              <Button
                variant="secondary"
                loading={saving}
                disabled={!pendingFile}
                onClick={() => void handleSave(true)}
              >
                <ScanLine size={16} />
                Save &amp; Scan Next
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </Layout>
  )
}

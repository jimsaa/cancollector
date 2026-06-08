import { useEffect, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router-dom'

import { ArrowLeft, Save, Trash2 } from 'lucide-react'

import { Layout } from '../components/layout/Layout'

import {
  applyScanImageToForm,
  CanFormFields,
  canToFormData,
  formDataToInsert,
  type CanFormData,
} from '../components/cans/CanForm'

import { TradeListingEditor } from '../components/trade/TradeListingEditor'

import { Card } from '../components/ui/Card'

import { Button } from '../components/ui/Button'

import { LoadingSpinner } from '../components/ui/LoadingSpinner'

import { EmptyState } from '../components/ui/EmptyState'

import { useAuth } from '../hooks/useAuth'

import { useGuestMessaging } from '../hooks/useGuestMessaging'

import { useCans } from '../hooks/useCans'

import { useCanImageUpload } from '../hooks/useCanImageUpload'

import { CanDetailImageTabs } from '../components/cans/CanDetailImageTabs'
import { getSaveImageFields } from '../lib/canImage'
import { fetchActiveMasterCans } from '../lib/masterCans'
import type { MasterCan } from '../types/masterCan'

import { fetchCanById } from '../lib/cans'

import { deleteCanImage } from '../lib/storage'

import { useGuestStorage } from '../lib/guestStorage'

import type { Can } from '../types/can'



export function CanDetailPage() {

  const { id } = useParams<{ id: string }>()

  const { storageUserId, premiumFeatures } = useAuth()

  const { triggerRegisterCTA } = useGuestMessaging()

  const { update, remove } = useCans(storageUserId, premiumFeatures.maxActiveTradeListings)

  const navigate = useNavigate()

  const imageUpload = useCanImageUpload(storageUserId, id)



  const [can, setCan] = useState<Can | null>(null)

  const [form, setForm] = useState<CanFormData | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [linkedMaster, setLinkedMaster] = useState<MasterCan | null>(null)



  useEffect(() => {

    if (!id) return

    setLoading(true)

    fetchCanById(id)

      .then((data) => {

        if (!data) {

          setError('Can not found')

          return

        }

        setCan(data)

        setForm(canToFormData(data))

      })

      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))

      .finally(() => setLoading(false))

  }, [id])

  useEffect(() => {
    if (!can?.master_can_id) {
      setLinkedMaster(null)
      return
    }
    let active = true
    fetchActiveMasterCans('all')
      .then((masters) => {
        if (!active) return
        setLinkedMaster(masters.find((m) => m.id === can.master_can_id) ?? null)
      })
      .catch(() => {
        if (active) setLinkedMaster(null)
      })
    return () => {
      active = false
    }
  }, [can?.master_can_id])

  const handleImageFile = async (file: File) => {

    if (!can || !form) return

    try {

      const previousUrl = can.user_image_url

      const url = await imageUpload.processFile(file)

      const imageFields = getSaveImageFields({
        ...form,
        user_image_url: url,
        image_source: 'user_uploaded',
      })
      const updated = await update(can.id, imageFields)

      setCan(updated)

      setForm(canToFormData(updated))

      if (previousUrl && previousUrl !== url && previousUrl.includes('/can-images/')) {

        await deleteCanImage(previousUrl).catch(() => undefined)

      }

    } catch {

      // uploadError shown in component

    }

  }



  const handleImageRemove = async () => {

    if (!can || !form) return

    imageUpload.clearUploadState()

    const previousUrl = can.user_image_url

    const nextForm = applyScanImageToForm({ ...form, user_image_url: '' })
    setForm(nextForm)

    try {

      const updated = await update(can.id, getSaveImageFields(nextForm))

      setCan(updated)

      setForm(canToFormData(updated))

      if (previousUrl?.includes('/can-images/')) {

        await deleteCanImage(previousUrl).catch(() => undefined)

      }

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to remove image')

      setForm({ ...form, user_image_url: previousUrl ?? '', image_source: 'user_uploaded' })

    }

  }



  const handleSave = async () => {

    if (!can || !form) return

    setSaving(true)

    setError(null)

    setMessage(null)

    const wasForTrade = can.available_for_trade

    try {

      let userImageUrl = form.user_image_url.trim()

      if (!useGuestStorage() && imageUpload.pendingBlob) {

        const cloudUrl = await imageUpload.uploadPendingForCan(can.id, form.user_image_url)

        if (cloudUrl) userImageUrl = cloudUrl

      }



      const insert = formDataToInsert({ ...form, user_image_url: userImageUrl })

      const updated = await update(can.id, insert)

      setCan(updated)

      setForm(canToFormData(updated))



      if (!wasForTrade && updated.available_for_trade) {

        triggerRegisterCTA('trade_listing')

      }

      setMessage('Changes saved')

      setTimeout(() => setMessage(null), 2000)

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Save failed')

    } finally {

      setSaving(false)

    }

  }



  const handleDelete = async () => {

    if (!can || !confirm('Delete this can from your collection?')) return

    setDeleting(true)

    try {

      if (can.user_image_url?.includes('/can-images/')) {

        await deleteCanImage(can.user_image_url).catch(() => undefined)

      }

      await remove(can.id)

      navigate(can.is_wishlist ? '/wishlist' : '/collection')

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Delete failed')

      setDeleting(false)

    }

  }



  if (loading) {

    return (

      <Layout title="Can Details" hideNav>

        <LoadingSpinner fullPage label="Loading can..." />

      </Layout>

    )

  }



  if (error && !can) {

    return (

      <Layout title="Can Details" hideNav>

        <EmptyState title="Can not found" description={error} />

        <Link to="/collection" className="mt-4 block text-center text-sm text-monster-green">

          Back to collection

        </Link>

      </Layout>

    )

  }



  if (!can || !form) return null



  return (

    <Layout title="Edit Can" hideNav>

      <Link

        to={can.is_wishlist ? '/wishlist' : '/collection'}

        className="mb-4 inline-flex items-center gap-1 text-sm text-monster-muted hover:text-white"

      >

        <ArrowLeft size={16} /> Back

      </Link>



      <div className="flex flex-col gap-4">

        <Card className="p-4">
          <CanDetailImageTabs
            data={form}
            onChange={setForm}
            onImageFileSelect={handleImageFile}
            onImageRemove={() => void handleImageRemove()}
            imageUploading={imageUpload.uploading || saving}
            imageUploadError={imageUpload.uploadError}
            imageSizeWarning={imageUpload.sizeWarning}
            masterSourceUrl={linkedMaster?.source_url}
            masterImageSource={linkedMaster?.image_source}
          />
        </Card>

        <Card className="p-4">
          <CanFormFields
            data={form}
            onChange={setForm}
            showWishlistFields={can.is_wishlist}
            hideImageUpload
          />
        </Card>



        {!form.is_wishlist && form.available_for_trade ? (
          can.available_for_trade ? (
            <TradeListingEditor can={can} premiumFeatures={premiumFeatures} />
          ) : (
            <Card className="border-monster-green/30 bg-monster-green/5 p-4">
              <p className="text-sm text-white">Trade listing ready</p>
              <p className="mt-1 text-xs text-monster-muted">
                Save changes above to create your trade listing with condition, photos, and
                description.
              </p>
            </Card>
          )
        ) : null}



        {message ? <p className="text-sm text-monster-green">{message}</p> : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}



        <Button fullWidth loading={saving} onClick={() => void handleSave()}>

          <Save size={18} />

          Save changes

        </Button>



        <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>

          <Trash2 size={18} />

          Delete Can

        </Button>

      </div>

    </Layout>

  )

}



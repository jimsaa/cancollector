import { useCallback, useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import {

  ArrowLeft,

  Check,

  ImageIcon,

  Lock,

  Shield,

  Trash2,

  Upload,

} from 'lucide-react'

import { AdminHubNav } from '../components/admin/AdminHubNav'
import { Layout } from '../components/layout/Layout'

import { Card } from '../components/ui/Card'

import { Button } from '../components/ui/Button'

import { Input } from '../components/ui/Input'

import { LoadingSpinner } from '../components/ui/LoadingSpinner'

import { EmptyState } from '../components/ui/EmptyState'

import { useAuth } from '../hooks/useAuth'

import {

  activateLocalAdminSession,

  clearLocalAdminSession,

  getAdminAccessState,

  getAdminPin,

} from '../lib/adminAuth'

import {

  approveMasterReferenceImage,

  fetchImageReviewQueue,

  keepMasterPlaceholder,

  rejectMasterReferenceImage,

  uploadMasterReferenceCandidate,

  updateAppDefaultPlaceholder,

  type ImageReviewQueueEntry,

  type ImageReviewQueueResult,

} from '../lib/imageReview'

import { getDefaultPlaceholderImageUrl } from '../lib/appSettings'

import { REFERENCE_IMAGE_STATUS_LABELS } from '../types/referenceImageStatus'

import type { MasterCan } from '../types/masterCan'



export function AdminImageReviewPage() {

  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()

  const [localAdmin, setLocalAdmin] = useState(false)

  const [pin, setPin] = useState('')

  const [pinError, setPinError] = useState<string | null>(null)

  const [queue, setQueue] = useState<ImageReviewQueueResult | null>(null)

  const [pendingOnly, setPendingOnly] = useState(true)

  const [loading, setLoading] = useState(false)

  const [actionId, setActionId] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  const [success, setSuccess] = useState<string | null>(null)

  const [editing, setEditing] = useState<ImageReviewQueueEntry | null>(null)

  const [referenceUrl, setReferenceUrl] = useState('')

  const [appPlaceholderUrl, setAppPlaceholderUrl] = useState(getDefaultPlaceholderImageUrl())



  const access = getAdminAccessState({

    loading: authLoading,

    isGuest,

    isConfigured,

    profile,

  })



  const granted = access === 'granted' || (access === 'pin_required' && localAdmin)



  const load = useCallback(async () => {

    if (!granted) return

    setLoading(true)

    setError(null)

    try {

      setQueue(await fetchImageReviewQueue(pendingOnly))

      setAppPlaceholderUrl(getDefaultPlaceholderImageUrl())

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to load image review queue')

    } finally {

      setLoading(false)

    }

  }, [granted, pendingOnly])



  useEffect(() => {

    if (granted) void load()

  }, [granted, load])



  const handleLocalLogin = () => {

    if (activateLocalAdminSession(pin)) {

      setLocalAdmin(true)

      setPinError(null)

    } else {

      setPinError('Invalid admin PIN')

    }

  }



  const openUpload = (entry: ImageReviewQueueEntry) => {

    setEditing(entry)

    setReferenceUrl(entry.master.reference_image_url ?? '')

  }



  const runAction = async (id: string, action: () => Promise<MasterCan>, message: string) => {

    setActionId(id)

    setError(null)

    setSuccess(null)

    try {

      await action()

      setSuccess(message)

      setEditing(null)

      await load()

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Action failed')

    } finally {

      setActionId(null)

    }

  }



  if (authLoading) {

    return (

      <Layout title="Image Review Queue">

        <LoadingSpinner label="Loading..." />

      </Layout>

    )

  }



  if (!granted) {

    return (

      <Layout title="Image Review Queue">

        <Card className="mx-auto max-w-md p-6">

          <div className="flex items-center gap-2 text-monster-green">

            <Shield size={20} />

            <p className="font-semibold text-white">Admin access required</p>

          </div>

          {access === 'pin_required' ? (

            <div className="mt-4 flex flex-col gap-3">

              <Input

                label="Admin PIN"

                type="password"

                value={pin}

                onChange={(e) => setPin(e.target.value)}

              />

              {pinError ? <p className="text-sm text-red-400">{pinError}</p> : null}

              <Button onClick={handleLocalLogin}>

                <Lock size={18} />

                Unlock

              </Button>

              <p className="text-[10px] text-monster-muted">PIN hint: {getAdminPin()}</p>

            </div>

          ) : (

            <p className="mt-3 text-sm text-monster-muted">

              Sign in with an admin account to review master reference images.

            </p>

          )}

        </Card>

      </Layout>

    )

  }



  return (

    <Layout title="Image Review Queue">

      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between gap-2">

          <Link to="/admin/imports" className="text-sm text-monster-green hover:underline">

            <ArrowLeft size={14} className="mr-1 inline" />

            Admin hub

          </Link>

        </div>



        <AdminHubNav

          showExit={access === 'pin_required'}

          onExit={() => {

            clearLocalAdminSession()

            setLocalAdmin(false)

          }}

        />



        <p className="text-sm text-monster-muted">

          Open Food Facts images never become approved references automatically. Review pending

          master cans and approve clean catalog images.

        </p>



        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">

          <div>

            <p className="text-sm font-semibold text-white">Filter</p>

            <p className="text-xs text-monster-muted">

              {pendingOnly

                ? `Showing ${queue?.entries.length ?? 0} pending (${queue?.pendingCount ?? 0} total pending)`

                : `Showing all ${queue?.entries.length ?? 0} queue items`}

            </p>

          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-white">

            <input

              type="checkbox"

              checked={pendingOnly}

              onChange={(e) => setPendingOnly(e.target.checked)}

              className="accent-monster-green"

            />

            Pending reference images only

          </label>

        </Card>



        <Card className="p-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">

            App default placeholder

          </p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">

            <Input

              label="Placeholder URL"

              value={appPlaceholderUrl}

              onChange={(e) => setAppPlaceholderUrl(e.target.value)}

            />

            <Button

              className="shrink-0 self-end py-3"

              onClick={() => {

                updateAppDefaultPlaceholder(appPlaceholderUrl.trim() || null)

                setSuccess('Default placeholder updated.')

              }}

            >

              Save

            </Button>

          </div>

        </Card>



        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {success ? <p className="text-sm text-monster-green">{success}</p> : null}

        {loading ? <LoadingSpinner label="Loading queue..." /> : null}



        {!loading && queue?.entries.length === 0 ? (

          <EmptyState

            icon={<Check size={40} />}

            title="Queue is empty"

            description={

              pendingOnly

                ? 'No master cans have pending reference images.'

                : 'No master cans need image review.'

            }

          />

        ) : null}



        {!loading && queue

          ? queue.entries.map((entry) => (

              <Card key={entry.master.id} className="p-4">

                <div className="flex flex-col gap-3">

                  <div>

                    <p className="text-lg font-bold text-white">{entry.master.product_name}</p>

                    <p className="font-mono text-xs text-monster-green">

                      {entry.master.barcode ?? 'No barcode'}

                    </p>

                    <p className="mt-1 text-[10px] text-monster-muted">

                      Status: {REFERENCE_IMAGE_STATUS_LABELS[entry.master.reference_image_status]}

                    </p>

                  </div>



                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                    <div>

                      <p className="mb-1 text-[10px] font-semibold uppercase text-monster-muted">

                        Open Food Facts

                      </p>

                      <div className="aspect-square overflow-hidden rounded-lg border border-yellow-600/30 bg-monster-dark">

                        {entry.offPreviewUrl ? (

                          <img

                            src={entry.offPreviewUrl}

                            alt="OFF preview"

                            className="h-full w-full object-contain p-2"

                          />

                        ) : (

                          <div className="flex h-full items-center justify-center text-[10px] text-monster-muted">

                            None

                          </div>

                        )}

                      </div>

                    </div>



                    <div>

                      <p className="mb-1 text-[10px] font-semibold uppercase text-monster-muted">

                        Current reference

                      </p>

                      <div className="aspect-square overflow-hidden rounded-lg border border-monster-border bg-monster-dark">

                        <img

                          src={entry.currentReferenceUrl ?? entry.placeholderUrl}

                          alt="Current reference"

                          className="h-full w-full object-contain p-2"

                        />

                      </div>

                      <p className="mt-1 text-[10px] text-monster-muted">

                        {entry.currentReferenceUrl ? 'Approved reference' : 'Placeholder'}

                      </p>

                    </div>



                    {entry.master.reference_image_url &&

                    entry.master.reference_image_status === 'pending' ? (

                      <div>

                        <p className="mb-1 text-[10px] font-semibold uppercase text-monster-muted">

                          Pending candidate

                        </p>

                        <div className="aspect-square overflow-hidden rounded-lg border border-monster-green/30 bg-monster-dark">

                          <img

                            src={entry.master.reference_image_url}

                            alt="Pending candidate"

                            className="h-full w-full object-contain p-2"

                          />

                        </div>

                      </div>

                    ) : null}

                  </div>



                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                    <Button className="py-2 text-xs" onClick={() => openUpload(entry)}>

                      <Upload size={14} />

                      Upload Better Reference Image

                    </Button>

                    <Button

                      className="py-2 text-xs"

                      disabled={actionId === entry.master.id}

                      onClick={() =>

                        void runAction(

                          entry.master.id,

                          () => approveMasterReferenceImage(entry.master),

                          `Approved reference for "${entry.master.product_name}".`,

                        )

                      }

                    >

                      <Check size={14} />

                      Approve

                    </Button>

                    <Button

                      variant="secondary"

                      className="py-2 text-xs"

                      disabled={actionId === entry.master.id}

                      onClick={() =>

                        void runAction(

                          entry.master.id,

                          () => rejectMasterReferenceImage(entry.master),

                          `Rejected reference for "${entry.master.product_name}".`,

                        )

                      }

                    >

                      <Trash2 size={14} />

                      Reject

                    </Button>

                    <Button

                      variant="secondary"

                      className="py-2 text-xs"

                      disabled={actionId === entry.master.id}

                      onClick={() =>

                        void runAction(

                          entry.master.id,

                          () => keepMasterPlaceholder(entry.master),

                          `Placeholder kept for "${entry.master.product_name}".`,

                        )

                      }

                    >

                      <ImageIcon size={14} />

                      Keep Placeholder

                    </Button>

                  </div>

                </div>

              </Card>

            ))

          : null}



        {editing ? (

          <Card className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-lg border-monster-green/40 p-4 shadow-xl sm:bottom-8">

            <p className="font-semibold text-white">Upload better reference image</p>

            <p className="mt-1 text-xs text-monster-muted">{editing.master.product_name}</p>

            <div className="mt-3">

              <Input

                label="Reference image URL"

                value={referenceUrl}

                onChange={(e) => setReferenceUrl(e.target.value)}

                placeholder="https://..."

              />

            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">

              <Button

                loading={actionId === editing.master.id}

                disabled={!referenceUrl.trim()}

                onClick={() =>

                  void runAction(

                    editing.master.id,

                    () => uploadMasterReferenceCandidate(editing.master, referenceUrl),

                    'Reference candidate uploaded — status set to pending.',

                  )

                }

              >

                Save candidate

              </Button>

              <Button variant="secondary" onClick={() => setEditing(null)}>

                Cancel

              </Button>

            </div>

          </Card>

        ) : null}

      </div>

    </Layout>

  )

}



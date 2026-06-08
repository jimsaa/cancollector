import type { Can } from '../types/can'
import type { MasterCan } from '../types/masterCan'
import type { ReferenceImageStatus } from '../types/referenceImageStatus'
import { REFERENCE_IMAGE_STATUSES } from '../types/referenceImageStatus'
import { getDefaultPlaceholderImageUrl, setDefaultPlaceholderImageUrl } from './appSettings'
import { getAllLocalCans } from './localCans'
import { fetchActiveMasterCans } from './masterCans'
import { updateMasterCanReference } from './masterCanAdmin'
import {
  getApprovedMasterReferenceImageUrl,
  getOffPreviewImageUrl,
} from './masterReferenceImage'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { supabase } from './supabase'
import { normalizeCanRecord } from './tradeFields'
import type { MasterImageSource } from '../types/masterImageSource'

export interface ImageReviewQueueEntry {
  master: MasterCan
  offPreviewUrl: string | null
  currentReferenceUrl: string | null
  placeholderUrl: string
}

export interface ImageReviewQueueResult {
  entries: ImageReviewQueueEntry[]
  pendingCount: number
  totalCount: number
}

function buildOffPreviewIndex(cans: Can[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const can of cans) {
    const code = can.barcode?.trim()
    const off = can.off_image_url?.trim()
    if (!code || !off || index.has(code)) continue
    index.set(code, off)
  }
  return index
}

function resolveOffPreview(master: MasterCan, offByBarcode: Map<string, string>): string | null {
  return getOffPreviewImageUrl(master) ?? (master.barcode ? offByBarcode.get(master.barcode.trim()) ?? null : null)
}

function entryFromMaster(master: MasterCan, offByBarcode: Map<string, string>): ImageReviewQueueEntry {
  return {
    master,
    offPreviewUrl: resolveOffPreview(master, offByBarcode),
    currentReferenceUrl: getApprovedMasterReferenceImageUrl(master),
    placeholderUrl: getDefaultPlaceholderImageUrl(),
  }
}

function isQueueCandidate(master: MasterCan, pendingOnly: boolean): boolean {
  if (pendingOnly) return master.reference_image_status === 'pending'
  return (
    master.reference_image_status === 'pending' ||
    master.reference_image_status === 'rejected' ||
    master.reference_image_status === 'placeholder' ||
    !getApprovedMasterReferenceImageUrl(master)
  )
}

async function fetchReviewUserCans(): Promise<Can[]> {
  if (!isConfigured || useGuestStorage()) {
    return getAllLocalCans().filter((c) => !c.is_wishlist)
  }
  if (!supabase) return []

  const { data, error } = await supabase
    .from('cans')
    .select('barcode, off_image_url')
    .eq('is_wishlist', false)
    .not('off_image_url', 'is', null)
    .limit(500)

  if (error) throw error
  return ((data ?? []) as Can[]).map(normalizeCanRecord)
}

export async function fetchImageReviewQueue(
  pendingOnly = true,
): Promise<ImageReviewQueueResult> {
  const [masters, userCans] = await Promise.all([
    fetchActiveMasterCans('all'),
    fetchReviewUserCans(),
  ])

  const offByBarcode = buildOffPreviewIndex(userCans)
  const entries = masters
    .filter((master) => isQueueCandidate(master, pendingOnly))
    .map((master) => entryFromMaster(master, offByBarcode))
    .sort((a, b) => a.master.product_name.localeCompare(b.master.product_name))

  const pendingCount = masters.filter((m) => m.reference_image_status === 'pending').length

  return {
    entries,
    pendingCount,
    totalCount: masters.filter((m) => isQueueCandidate(m, false)).length,
  }
}

export async function uploadMasterReferenceCandidate(
  master: MasterCan,
  referenceImageUrl: string,
): Promise<MasterCan> {
  return updateMasterCanReference(master, {
    reference_image_url: referenceImageUrl.trim(),
    image_source: 'manual',
    reference_image_status: 'pending',
  })
}

export async function approveMasterReferenceImage(
  master: MasterCan,
  referenceImageUrl?: string,
): Promise<MasterCan> {
  const url = referenceImageUrl?.trim() || master.reference_image_url?.trim()
  if (!url) throw new Error('Reference image URL required to approve')

  return updateMasterCanReference(master, {
    reference_image_url: url,
    image_source: master.image_source === 'open_food_facts' ? 'manual' : master.image_source ?? 'manual',
    reference_image_status: 'approved',
  })
}

export async function rejectMasterReferenceImage(master: MasterCan): Promise<MasterCan> {
  return updateMasterCanReference(master, {
    reference_image_url: null,
    reference_image_status: 'rejected',
    image_source: 'placeholder',
  })
}

export async function keepMasterPlaceholder(master: MasterCan): Promise<MasterCan> {
  return updateMasterCanReference(master, {
    reference_image_url: null,
    reference_image_status: 'placeholder',
    image_source: 'placeholder',
  })
}

export function updateAppDefaultPlaceholder(url: string | null): void {
  setDefaultPlaceholderImageUrl(url)
}

export function isValidReferenceImageStatus(value: string): value is ReferenceImageStatus {
  return REFERENCE_IMAGE_STATUSES.includes(value as ReferenceImageStatus)
}

export type { MasterImageSource }

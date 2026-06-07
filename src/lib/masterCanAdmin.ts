import type { MasterCan } from '../types/masterCan'
import type { MasterImageSource } from '../types/masterImageSource'
import { upsertLocalApprovedMasterCan } from './localMasterCans'
import { normalizeMasterCan } from './masterCanNormalize'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { supabase } from './supabase'

export interface UpdateMasterReferenceInput {
  reference_image_url?: string | null
  image_source?: MasterImageSource | null
  source_url?: string | null
}

/** Admin-only: update catalog reference image on an approved master can. */
export async function updateMasterCanReference(
  master: MasterCan,
  updates: UpdateMasterReferenceInput,
): Promise<MasterCan> {
  const reference_image_url =
    updates.reference_image_url?.trim() || master.reference_image_url?.trim() || null
  const image_source = updates.image_source ?? master.image_source ?? 'manual'
  const source_url = updates.source_url?.trim() ?? master.source_url ?? null

  const patch = {
    ...master,
    reference_image_url,
    image_url: reference_image_url,
    image_source,
    source_url,
  }

  if (!isConfigured || useGuestStorage()) {
    return upsertLocalApprovedMasterCan(patch)
  }

  if (!supabase) throw new Error('Supabase client unavailable')

  const { data, error } = await supabase
    .from('master_cans')
    .update({
      reference_image_url,
      image_url: reference_image_url,
      image_source,
      source_url,
    })
    .eq('id', master.id)
    .select()
    .single()

  if (error) throw error
  return normalizeMasterCan(data as MasterCan)
}

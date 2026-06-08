import type { Can, CanInsert, CanUpdate, WishlistStatus } from '../types/can'
import { normalizeCanCollectorFields, syncCollectorFieldsOnUpdate } from './canCollectorFields'
import { normalizeCanImageFields } from './canImage'

/** Derive wanted flag from wishlist status when not explicitly set. */
export function resolveWanted(
  isWishlist: boolean,
  wishlistStatus: WishlistStatus | null | undefined,
  explicitWanted?: boolean,
): boolean {
  if (explicitWanted !== undefined) return explicitWanted
  if (!isWishlist) return false
  return wishlistStatus !== 'missing'
}

export function normalizeCanTradeFields<T extends CanInsert | CanUpdate>(input: T): T {
  const synced = syncCollectorFieldsOnUpdate(input as CanUpdate) as T
  const isWishlist = synced.is_wishlist ?? false
  const wishlistStatus = synced.wishlist_status ?? null

  if ('wanted' in synced && synced.wanted !== undefined) {
    return synced
  }

  if (synced.is_wishlist !== undefined || synced.wishlist_status !== undefined) {
    return {
      ...synced,
      wanted: resolveWanted(isWishlist, wishlistStatus),
    }
  }

  return synced
}

export function normalizeCanRecord(can: Can): Can {
  return normalizeCanCollectorFields(
    normalizeCanImageFields({
      ...can,
      wanted: can.wanted ?? resolveWanted(can.is_wishlist, can.wishlist_status),
    }),
  )
}

export function applyWishlistStatusWithWanted(status: WishlistStatus): Pick<CanUpdate, 'wishlist_status' | 'wanted'> {
  return {
    wishlist_status: status,
    wanted: status === 'wanted',
  }
}

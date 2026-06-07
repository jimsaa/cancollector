import type { Can, CanInsert, CanUpdate, WishlistStatus } from '../types/can'
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
  const isWishlist = input.is_wishlist ?? false
  const wishlistStatus = input.wishlist_status ?? null

  if ('wanted' in input && input.wanted !== undefined) {
    return input
  }

  if (input.is_wishlist !== undefined || input.wishlist_status !== undefined) {
    return {
      ...input,
      wanted: resolveWanted(isWishlist, wishlistStatus),
    }
  }

  return input
}

export function normalizeCanRecord(can: Can): Can {
  return normalizeCanImageFields({
    ...can,
    wanted: can.wanted ?? resolveWanted(can.is_wishlist, can.wishlist_status),
  })
}

export function applyWishlistStatusWithWanted(status: WishlistStatus): Pick<CanUpdate, 'wishlist_status' | 'wanted'> {
  return {
    wishlist_status: status,
    wanted: status === 'wanted',
  }
}

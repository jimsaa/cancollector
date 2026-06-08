import type { Can } from '../types/can'
import type { MasterCan } from '../types/masterCan'
import type { UserCanStatusType } from '../types/userCanStatus'
import {
  findWishlistEntryForMaster,
  isMasterCanOwned,
  masterCanToCollectionInsert,
  masterCanToWishlistInsert,
} from './masterCanMatching'
import { addUserWishlist, removeUserWishlist } from './userWishlist'
import { clearUserCanStatus, setUserCanStatus } from './userCanStatus'

export interface MasterCanStatusDeps {
  userId: string
  cans: Can[]
  add: (insert: ReturnType<typeof masterCanToCollectionInsert>) => Promise<unknown>
  remove: (id: string) => Promise<unknown>
  reloadCans: () => Promise<void>
  reloadWishlist: () => Promise<void>
  reloadStatus: () => Promise<void>
}

export async function applyMasterCanStatus(
  master: MasterCan,
  status: UserCanStatusType,
  deps: MasterCanStatusDeps,
): Promise<void> {
  const { userId, cans, add, remove, reloadCans, reloadWishlist, reloadStatus } = deps
  const owned = isMasterCanOwned(master, cans)
  const wishlistEntry = findWishlistEntryForMaster(master, cans)

  if (status === 'got') {
    await setUserCanStatus(userId, master.id, 'got')
    if (!owned) await add(masterCanToCollectionInsert(master))
    if (wishlistEntry) await remove(wishlistEntry.id)
    await removeUserWishlist(userId, master.id)
  } else if (status === 'want') {
    await setUserCanStatus(userId, master.id, 'want')
    if (!wishlistEntry) {
      await addUserWishlist(userId, master.id)
      await add(masterCanToWishlistInsert(master))
    }
  } else if (status === 'need') {
    await setUserCanStatus(userId, master.id, 'need')
  }

  await Promise.all([reloadCans(), reloadWishlist(), reloadStatus()])
}

export async function clearMasterCanStatus(
  master: MasterCan,
  deps: MasterCanStatusDeps,
): Promise<void> {
  const { userId, cans, remove, reloadCans, reloadWishlist, reloadStatus } = deps
  const wishlistEntry = findWishlistEntryForMaster(master, cans)

  await clearUserCanStatus(userId, master.id)
  if (wishlistEntry) await remove(wishlistEntry.id)
  await removeUserWishlist(userId, master.id)

  await Promise.all([reloadCans(), reloadWishlist(), reloadStatus()])
}

export async function toggleMasterCanStatus(
  master: MasterCan,
  status: UserCanStatusType,
  currentStatus: UserCanStatusType | null | undefined,
  deps: MasterCanStatusDeps,
): Promise<void> {
  if (currentStatus === status) {
    await clearMasterCanStatus(master, deps)
    return
  }
  await applyMasterCanStatus(master, status, deps)
}

import type { ApproveAllBatchResult, ApproveSuggestionResult } from './pendingSuggestions'

export function formatApproveSuggestionMessage(result: ApproveSuggestionResult): string {
  const action = result.updatedExisting ? 'Existing master can updated' : 'New master can approved'
  const name = result.master.product_name ?? 'Product'
  const linked =
    result.linkedCans > 0
      ? ` Linked ${result.linkedCans} user can${result.linkedCans === 1 ? '' : 's'}.`
      : ''
  return `${action}: "${name}".${linked}`
}

export function formatApproveAllSummary(result: ApproveAllBatchResult): string {
  const parts = [
    `${result.approved} approved`,
    `${result.updated} updated`,
    `${result.skipped} skipped`,
    `${result.failed} failed`,
  ]
  let message = `Batch complete: ${parts.join(', ')}.`
  if (result.errors.length > 0) {
    const preview = result.errors.slice(0, 3).join(' · ')
    const more = result.errors.length > 3 ? ` (+${result.errors.length - 3} more)` : ''
    message += ` Errors: ${preview}${more}`
  }
  return message
}

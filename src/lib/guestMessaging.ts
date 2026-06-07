export type GuestMilestone = 'first_can' | 'three_cans' | 'trade_listing' | 'backup'

const MILESTONES_KEY = 'cancollector-guest-milestones'

function readMilestones(): Set<GuestMilestone> {
  try {
    const raw = localStorage.getItem(MILESTONES_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as GuestMilestone[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeMilestones(shown: Set<GuestMilestone>): void {
  localStorage.setItem(MILESTONES_KEY, JSON.stringify([...shown]))
}

export function hasShownMilestone(milestone: GuestMilestone): boolean {
  return readMilestones().has(milestone)
}

export function markMilestoneShown(milestone: GuestMilestone): void {
  const shown = readMilestones()
  shown.add(milestone)
  writeMilestones(shown)
}

/** Returns true if this milestone should fire (not shown before). */
export function shouldTriggerMilestone(milestone: GuestMilestone): boolean {
  return !hasShownMilestone(milestone)
}

export function formatImportResult(imported: number, merged: number, skipped: number): string {
  const total = imported + merged
  const parts: string[] = []
  if (total > 0) {
    parts.push(`${total} can${total === 1 ? '' : 's'} imported`)
  }
  if (skipped > 0) {
    parts.push(`${skipped} duplicate${skipped === 1 ? '' : 's'} skipped`)
  }
  if (parts.length === 0) return 'No cans to import.'
  return parts.join(', ') + '.'
}

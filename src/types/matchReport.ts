export type MatchReportStatus = 'new' | 'approved' | 'dismissed'

export interface MatchReport {
  id: string
  user_id: string
  barcode: string
  matched_master_can_id: string | null
  suggested_master_can_id: string | null
  off_product_name: string | null
  comment: string | null
  status: MatchReportStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface MatchReportInsert {
  barcode: string
  matched_master_can_id?: string | null
  suggested_master_can_id?: string | null
  off_product_name?: string | null
  comment?: string | null
}

export type MatchReportUpdate = Partial<Pick<MatchReport, 'status' | 'admin_notes'>>

export const MATCH_REPORT_STATUS_LABELS: Record<MatchReportStatus, string> = {
  new: 'New',
  approved: 'Approved',
  dismissed: 'Dismissed',
}

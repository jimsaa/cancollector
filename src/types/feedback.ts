export type FeedbackType = 'bug' | 'feature' | 'image_correction' | 'trade' | 'other'

export type FeedbackPriority = 'low' | 'normal' | 'high'

export type FeedbackStatus = 'new' | 'reviewed' | 'planned' | 'fixed' | 'rejected'

export interface Feedback {
  id: string
  user_id: string
  user_email: string | null
  display_name: string | null
  type: FeedbackType
  title: string
  message: string
  priority: FeedbackPriority
  current_url: string | null
  user_agent: string | null
  screenshot_url: string | null
  status: FeedbackStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type FeedbackInsert = Pick<
  Feedback,
  | 'type'
  | 'title'
  | 'message'
  | 'priority'
  | 'current_url'
  | 'user_agent'
  | 'user_email'
  | 'display_name'
  | 'screenshot_url'
>

export type FeedbackUpdate = Partial<Pick<Feedback, 'status' | 'admin_notes'>>

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug report',
  feature: 'Feature request',
  image_correction: 'Image/database correction',
  trade: 'Trade issue',
  other: 'Other',
}

export const FEEDBACK_PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  planned: 'Planned',
  fixed: 'Fixed',
  rejected: 'Rejected',
}

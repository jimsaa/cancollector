import type {
  Feedback,
  FeedbackInsert,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
  FeedbackUpdate,
} from '../types/feedback'
import { uploadFeedbackScreenshot } from './feedbackStorage'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function normalizeFeedback(row: Feedback): Feedback {
  return {
    ...row,
    user_email: row.user_email ?? null,
    display_name: row.display_name ?? null,
    current_url: row.current_url ?? null,
    user_agent: row.user_agent ?? null,
    screenshot_url: row.screenshot_url ?? null,
    admin_notes: row.admin_notes ?? null,
    priority: row.priority ?? 'normal',
    status: row.status ?? 'new',
  }
}

export interface SubmitFeedbackInput extends FeedbackInsert {
  user_id: string
}

export interface SubmitFeedbackResult {
  feedback: Feedback
  screenshotWarning: string | null
}

export async function submitFeedback(
  input: SubmitFeedbackInput,
  screenshotFile?: File | null,
): Promise<SubmitFeedbackResult> {
  const client = requireClient()
  const feedbackId = crypto.randomUUID()
  let screenshot_url: string | null = null
  let screenshotWarning: string | null = null

  if (screenshotFile) {
    try {
      screenshot_url = await uploadFeedbackScreenshot(input.user_id, feedbackId, screenshotFile)
    } catch (err) {
      screenshotWarning =
        err instanceof Error
          ? `Screenshot upload failed: ${err.message}. Feedback was still submitted.`
          : 'Screenshot upload failed. Feedback was still submitted.'
    }
  }

  const { data, error } = await client
    .from('feedback')
    .insert({
      id: feedbackId,
      user_id: input.user_id,
      user_email: input.user_email,
      display_name: input.display_name,
      type: input.type,
      title: input.title.trim(),
      message: input.message.trim(),
      priority: input.priority,
      current_url: input.current_url,
      user_agent: input.user_agent,
      screenshot_url,
      status: 'new',
    })
    .select()
    .single()

  if (error) throw error
  return { feedback: normalizeFeedback(data as Feedback), screenshotWarning }
}

export async function fetchMyFeedback(userId: string): Promise<Feedback[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as Feedback[]).map(normalizeFeedback)
}

export interface FeedbackFilters {
  type?: FeedbackType | 'all'
  status?: FeedbackStatus | 'all'
  priority?: FeedbackPriority | 'all'
  search?: string
}

export async function fetchAdminFeedback(filters: FeedbackFilters = {}): Promise<Feedback[]> {
  const client = requireClient()
  let query = client.from('feedback').select('*').order('created_at', { ascending: false })

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  const { data, error } = await query
  if (error) throw error

  let rows = ((data ?? []) as Feedback[]).map(normalizeFeedback)
  const search = filters.search?.trim().toLowerCase()
  if (search) {
    rows = rows.filter(
      (row) =>
        row.title.toLowerCase().includes(search) ||
        row.message.toLowerCase().includes(search) ||
        (row.display_name ?? '').toLowerCase().includes(search) ||
        (row.user_email ?? '').toLowerCase().includes(search),
    )
  }
  return rows
}

export async function fetchNewFeedbackCount(): Promise<number> {
  const client = requireClient()
  const { count, error } = await client
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  if (error) throw error
  return count ?? 0
}

export async function updateFeedback(id: string, patch: FeedbackUpdate): Promise<Feedback> {
  const client = requireClient()
  const { data, error } = await client
    .from('feedback')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return normalizeFeedback(data as Feedback)
}


import type { SubmitReportInput } from '../types/admin'
import type { ReportRow } from '../types/database'
import { getSupabaseErrorMessage } from './errors'
import { supabase } from './supabase'

export async function submitReport(input: SubmitReportInput) {
  console.debug('[Genza] report submit', {
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId ?? null,
    taskId: input.taskId ?? null,
    chatId: input.chatId ?? null,
    messageId: input.messageId ?? null,
    reason: input.reason,
  })

  const payload = {
    reporter_id: input.reporterId,
    reported_user_id: input.reportedUserId ?? null,
    task_id: input.taskId ? Number(input.taskId) : null,
    chat_id: input.chatId ? Number(input.chatId) : null,
    message_id: input.messageId ?? null,
    reason: input.reason.trim(),
    details: input.details?.trim() || null,
    status: 'open' as const,
  }

  const { data, error } = await supabase
    .from('reports')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.debug('[Genza] report submit failed', { error: error.message })
    return { success: false, error: getSupabaseErrorMessage(error) }
  }

  console.debug('[Genza] report submit success', { reportId: data?.id ?? null })

  return { success: true, reportId: data ? String((data as ReportRow).id) : undefined, error: undefined }
}

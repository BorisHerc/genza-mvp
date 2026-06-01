import type { Review } from '../types/marketplace'
import type { ReviewAuthoredDetails, ReviewWithDetails, CompletedWorkItem } from '../types/profile'
import type { ReviewRow, TaskRow } from '../types/database'
import { getSupabaseErrorMessage } from './errors'
import { translate } from './i18n'
import { parseNumericTaskId } from './ids'
import { fetchProfiles } from './profiles'
import { notifyReviewReceived } from './notifications'
import { supabase } from './supabase'
import { isTaskCompleted } from './task-status'

function mapReview(row: ReviewRow): Review {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewed_user_id,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  }
}

export async function getReviewForTask(taskIdRaw: string, reviewerId: string) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) {
    return { review: null as Review | null, error: translate('api.invalidTaskId') }
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('task_id', taskId)
    .eq('reviewer_id', reviewerId)
    .maybeSingle()

  if (error) return { review: null, error: getSupabaseErrorMessage(error) }
  if (!data) return { review: null, error: undefined }

  return { review: mapReview(data as ReviewRow), error: undefined }
}

export async function listReviewsReceivedByUser(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewed_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { reviews: [] as Review[], error: getSupabaseErrorMessage(error) }
  }

  const reviews = ((data ?? []) as ReviewRow[]).map(mapReview)

  console.log('[Genza] listReviewsReceivedByUser', {
    userId,
    reviewCount: reviews.length,
  })

  return { reviews, error: undefined }
}

export async function listPublicReviewsForUser(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewed_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return { reviews: [] as ReviewWithDetails[], error: getSupabaseErrorMessage(error) }
  }

  const rows = (data ?? []) as ReviewRow[]
  if (!rows.length) return { reviews: [] as ReviewWithDetails[], error: undefined }

  const taskIds = [...new Set(rows.map((row) => row.task_id))]
  const reviewerIds = [...new Set(rows.map((row) => row.reviewer_id))]

  const [{ data: tasks }, { profiles }] = await Promise.all([
    supabase.from('tasks').select('id, title, category').in('id', taskIds),
    fetchProfiles(reviewerIds),
  ])

  const taskMap = new Map((tasks ?? []).map((task) => [String(task.id), task]))
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  const reviews = rows.map((row) => {
    const task = taskMap.get(String(row.task_id))
    const reviewer = profileMap.get(row.reviewer_id)

    return {
      id: String(row.id),
      taskId: String(row.task_id),
      taskTitle: task?.title ?? translate('api.completedTaskFallback'),
      taskCategory: task?.category ?? null,
      reviewerId: row.reviewer_id,
      reviewerName: reviewer?.full_name?.trim() || translate('api.clientFallback'),
      revieweeId: row.reviewed_user_id,
      rating: row.rating,
      comment: row.comment ?? undefined,
      createdAt: row.created_at,
    } satisfies ReviewWithDetails
  })

  return { reviews, error: undefined }
}

export async function listReviewsWrittenWithDetails(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewer_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return { reviews: [] as ReviewAuthoredDetails[], error: getSupabaseErrorMessage(error) }
  }

  const rows = (data ?? []) as ReviewRow[]
  if (!rows.length) return { reviews: [] as ReviewAuthoredDetails[], error: undefined }

  const taskIds = [...new Set(rows.map((row) => row.task_id))]
  const revieweeIds = [...new Set(rows.map((row) => row.reviewed_user_id))]

  const [{ data: tasks }, { profiles }] = await Promise.all([
    supabase.from('tasks').select('id, title, category').in('id', taskIds),
    fetchProfiles(revieweeIds),
  ])

  const taskMap = new Map((tasks ?? []).map((task) => [String(task.id), task]))
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  const reviews = rows.map((row) => {
    const task = taskMap.get(String(row.task_id))
    const reviewee = profileMap.get(row.reviewed_user_id)

    return {
      id: String(row.id),
      taskId: String(row.task_id),
      taskTitle: task?.title ?? translate('api.completedTaskFallback'),
      taskCategory: task?.category ?? null,
      revieweeId: row.reviewed_user_id,
      revieweeName: reviewee?.full_name?.trim() || translate('common.memberFallback'),
      rating: row.rating,
      comment: row.comment ?? undefined,
      createdAt: row.created_at,
    } satisfies ReviewAuthoredDetails
  })

  return { reviews, error: undefined }
}

export async function listCompletedWorkForTasker(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_tasker_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return { items: [] as CompletedWorkItem[], error: getSupabaseErrorMessage(error) }
  }

  const rows = ((data ?? []) as TaskRow[]).filter((row) => isTaskCompleted(row.status))
  if (!rows.length) return { items: [] as CompletedWorkItem[], error: undefined }

  const taskIds = rows.map((row) => row.id)
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('task_id, rating, comment')
    .eq('reviewed_user_id', userId)
    .in('task_id', taskIds)

  const reviewMap = new Map(
    ((reviewRows ?? []) as Array<{ task_id: number; rating: number; comment: string | null }>).map(
      (review) => [String(review.task_id), review],
    ),
  )

  const items = rows.map((row) => {
    const review = reviewMap.get(String(row.id))

    return {
      id: String(row.id),
      title: row.title,
      category: row.category,
      completedAt: row.created_at,
      review: review
        ? {
            rating: review.rating,
            comment: review.comment ?? undefined,
          }
        : undefined,
    } satisfies CompletedWorkItem
  })

  return { items, error: undefined }
}

export async function submitReview(input: {
  taskId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
}) {
  const taskId = parseNumericTaskId(input.taskId)
  if (taskId === null) {
    return { review: null as Review | null, error: translate('api.invalidTaskId') }
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { review: null, error: translate('reviews.ratingRequired') }
  }

  console.log('[Genza] submitReview (before review insert)', {
    taskId,
    reviewerId: input.reviewerId,
    revieweeId: input.revieweeId,
    rating: input.rating,
    hasComment: Boolean(input.comment?.trim()),
  })

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      task_id: taskId,
      reviewer_id: input.reviewerId,
      reviewed_user_id: input.revieweeId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[Genza] submitReview (review insert failed)', error)
    return { review: null, error: getSupabaseErrorMessage(error) }
  }

  const review = mapReview(data as ReviewRow)

  console.log('[Genza] submitReview (after review insert)', {
    reviewId: review.id,
    reviewedUserId: review.revieweeId,
    taskId: review.taskId,
  })

  const notification = await notifyReviewReceived({
    revieweeId: review.revieweeId,
    taskId: review.taskId,
    rating: review.rating,
    comment: review.comment,
  })

  if (!notification.success) {
    console.error('[Genza] submitReview (notification not created)', {
      reviewId: review.id,
      reviewedUserId: review.revieweeId,
      error: notification.error,
    })
  }

  return {
    review,
    error: undefined,
    notificationError: notification.success ? undefined : notification.error,
  }
}

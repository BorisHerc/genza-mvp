import type { TaskStatus } from '../types'
import { translate } from './i18n'

const KNOWN_STATUSES: TaskStatus[] = [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]

const STATUS_ALIASES: Record<string, TaskStatus> = {
  complete: 'completed',
  done: 'completed',
  finished: 'completed',
  closed: 'completed',
  resolved: 'completed',
  archived: 'completed',
  inprogress: 'in_progress',
  canceled: 'cancelled',
  cancelled: 'cancelled',
}

function normalizeStatusRaw(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'open'
  return String(value).toLowerCase().trim().replace(/[\s-]+/g, '_')
}

export function normalizeTaskStatus(value: string | number | null | undefined): TaskStatus {
  const raw = normalizeStatusRaw(value)

  if (KNOWN_STATUSES.includes(raw as TaskStatus)) {
    return raw as TaskStatus
  }

  return STATUS_ALIASES[raw] ?? 'open'
}

export function isTaskCompleted(value: string | number | null | undefined): boolean {
  const raw = normalizeStatusRaw(value)
  if (raw === 'completed') return true
  return STATUS_ALIASES[raw] === 'completed'
}

export function isTaskCancelled(value: string | number | null | undefined): boolean {
  const raw = normalizeStatusRaw(value)
  return raw === 'cancelled' || STATUS_ALIASES[raw] === 'cancelled'
}

export function isTaskTerminal(value: string | number | null | undefined): boolean {
  return isTaskCompleted(value) || isTaskCancelled(value)
}

export function isTaskActive(value: string | number | null | undefined): boolean {
  const status = normalizeTaskStatus(value)
  return status === 'assigned' || status === 'in_progress'
}

export function getTaskStatusLabel(status: string | number | null | undefined): string {
  const raw = normalizeStatusRaw(status)

  if (KNOWN_STATUSES.includes(raw as TaskStatus)) {
    return translate(`tasks.status.${raw as TaskStatus}`)
  }

  if (STATUS_ALIASES[raw]) {
    return translate(`tasks.status.${STATUS_ALIASES[raw]}`)
  }

  const original = String(status ?? '').trim()
  if (original) {
    return original.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  }

  return translate('common.unknown')
}

export function isKnownTaskStatus(status: string | number | null | undefined): status is TaskStatus {
  const raw = normalizeStatusRaw(status)
  return KNOWN_STATUSES.includes(raw as TaskStatus) || raw in STATUS_ALIASES
}

export type TimelineStepState = 'complete' | 'current' | 'upcoming' | 'cancelled'

export interface TaskTimelineStep {
  key: TaskStatus | 'cancelled'
  label: string
  state: TimelineStepState
}

export function getTaskTimelineSteps(statusRaw: string | number | null | undefined): TaskTimelineStep[] {
  const status = normalizeTaskStatus(statusRaw)

  if (isTaskCancelled(statusRaw)) {
    return [
      { key: 'open', label: translate('tasks.timeline.posted'), state: 'complete' },
      { key: 'assigned', label: translate('tasks.timeline.assigned'), state: 'complete' },
      { key: 'cancelled', label: translate('tasks.timeline.cancelled'), state: 'cancelled' },
      { key: 'completed', label: translate('tasks.timeline.completed'), state: 'upcoming' },
    ]
  }

  const steps: TaskTimelineStep[] = [
    { key: 'open', label: translate('tasks.timeline.posted'), state: 'upcoming' },
    { key: 'assigned', label: translate('tasks.timeline.assigned'), state: 'upcoming' },
    { key: 'in_progress', label: translate('tasks.timeline.in_progress'), state: 'upcoming' },
    { key: 'completed', label: translate('tasks.timeline.completed'), state: 'upcoming' },
  ]

  const order: TaskStatus[] = ['open', 'assigned', 'in_progress', 'completed']
  const index = order.indexOf(status)

  return steps.map((step, stepIndex) => {
    if (stepIndex < index) return { ...step, state: 'complete' }
    if (stepIndex === index) return { ...step, state: 'current' }
    return step
  })
}

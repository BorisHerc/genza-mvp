import { getTaskStatusLabel, normalizeTaskStatus } from '../../lib/task-status'
import { Badge } from '../ui/Badge'

const variantMap = {
  open: 'brand',
  assigned: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'urgent',
} as const

export function TaskStatusBadge({ status }: { status: string }) {
  const normalized = normalizeTaskStatus(status)
  const label = getTaskStatusLabel(status)
  const variant = variantMap[normalized] ?? 'muted'

  return <Badge variant={variant}>{label}</Badge>
}

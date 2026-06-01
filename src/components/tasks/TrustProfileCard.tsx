import { BadgeCheck, Briefcase, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { User } from '../../types'
import { formatRating } from '../../lib/profile-text'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'

interface TrustProfileCardProps {
  title: string
  user: User
  profilePath?: string
  completedJobsCount?: number
}

export function TrustProfileCard({
  title,
  user,
  profilePath,
  completedJobsCount = 0,
}: TrustProfileCardProps) {
  const content = (
    <Card className="flex items-center gap-3">
      <Avatar name={user.name} imageUrl={user.avatarUrl} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
          {user.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-gray-700">{formatRating(user.rating)}</span>
            <span>({user.reviewCount} reviews)</span>
          </span>
          {completedJobsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-brand-500" />
              {completedJobsCount} completed
            </span>
          )}
        </div>
      </div>
    </Card>
  )

  if (!profilePath) return content

  return (
    <Link to={profilePath} className="block transition-opacity hover:opacity-90">
      {content}
    </Link>
  )
}

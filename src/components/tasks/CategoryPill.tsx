import { cn } from '../../lib/utils'

interface CategoryPillProps {
  icon: string
  label: string
  active?: boolean
  onClick?: () => void
}

export function CategoryPill({
  icon,
  label,
  active = false,
  onClick,
}: CategoryPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50',
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </button>
  )
}

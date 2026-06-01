import { User } from 'lucide-react'

interface AvatarProps {
  name: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={[
          'shrink-0 rounded-full object-cover ring-2 ring-white',
          sizeStyles[size],
          className,
        ].join(' ')}
      />
    )
  }

  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white',
        sizeStyles[size],
        className,
      ].join(' ')}
      aria-hidden={!name}
    >
      {name ? getInitials(name) : <User className="h-4 w-4" />}
    </div>
  )
}

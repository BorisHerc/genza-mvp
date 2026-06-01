import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface TaskStickyActionsProps {
  children: ReactNode
  className?: string
}

export function TaskStickyActions({ children, className }: TaskStickyActionsProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-4 shadow-nav backdrop-blur-md safe-bottom lg:hidden',
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2">{children}</div>
    </div>
  )
}

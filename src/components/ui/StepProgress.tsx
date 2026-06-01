import { cn } from '../../lib/utils'

interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    isComplete && 'bg-brand-600 text-white',
                    isCurrent && 'bg-brand-100 text-brand-700 ring-2 ring-brand-500',
                    !isComplete && !isCurrent && 'bg-gray-100 text-gray-400',
                  )}
                >
                  {isComplete ? '✓' : stepNumber}
                </span>
                <span
                  className={cn(
                    'hidden truncate text-[10px] font-medium sm:block',
                    isCurrent ? 'text-brand-700' : 'text-gray-400',
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mb-4 h-0.5 flex-1 rounded-full',
                    stepNumber < currentStep ? 'bg-brand-400' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-xs text-gray-500">
        Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
      </p>
    </div>
  )
}

import { Card } from '../ui/Card'

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse px-4 pt-6 pb-8">
      <div className="mb-6 flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-gray-200" />
        <div className="mt-4 h-6 w-40 rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-28 rounded-lg bg-gray-200" />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 rounded-2xl bg-gray-200" />
        ))}
      </div>

      <Card className="mb-4 space-y-3">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </Card>

      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  )
}

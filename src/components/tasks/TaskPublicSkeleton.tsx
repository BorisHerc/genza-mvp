import { Card } from '../ui/Card'

export function TaskPublicSkeleton() {
  return (
    <div className="animate-pulse px-4 pb-8 pt-4">
      <div className="mb-4 h-4 w-16 rounded bg-gray-200" />
      <div className="mb-3 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-gray-200" />
        <div className="h-6 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mb-2 h-8 w-4/5 rounded-lg bg-gray-200" />
      <div className="mb-6 h-7 w-28 rounded-lg bg-gray-200" />

      <Card className="mb-4 space-y-3">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </Card>

      <Card className="mb-4 space-y-2">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
      </Card>

      <div className="h-24 rounded-2xl bg-gray-200" />
    </div>
  )
}

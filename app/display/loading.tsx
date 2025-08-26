import { Skeleton } from "@/components/ui/skeleton"

export default function DisplayLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-10 w-80 mb-2" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>

      <Skeleton className="h-48 mt-8" />
    </div>
  )
}

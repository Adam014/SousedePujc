export default function ItemLoading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          {/* Image skeleton */}
          <div className="aspect-video rounded-lg bg-gray-200 animate-pulse mb-4 sm:mb-6" />
          {/* Title skeleton */}
          <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4 mb-4" />
          {/* Meta skeleton */}
          <div className="flex gap-4 mb-4">
            <div className="h-5 bg-gray-200 animate-pulse rounded w-32" />
            <div className="h-5 bg-gray-200 animate-pulse rounded w-40" />
          </div>
          {/* Tabs skeleton */}
          <div className="h-10 bg-gray-200 animate-pulse rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-4/6" />
          </div>
        </div>
        <div className="lg:col-span-1">
          {/* Booking card skeleton */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-6 bg-gray-200 animate-pulse rounded w-24" />
              <div className="h-8 bg-gray-200 animate-pulse rounded w-20" />
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded" />
            <div className="h-10 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

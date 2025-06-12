import { Star } from "lucide-react"

interface RatingDisplayProps {
  rating: number
  reviewCount: number
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export default function RatingDisplay({ rating, reviewCount, showText = true, size = "md" }: RatingDisplayProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"

  if (reviewCount === 0 || rating === 0) {
    return (
      <div className="flex items-center space-x-1">
        <Star className={`${iconSize} text-gray-300`} />
        {showText && <span className={`${textSize} text-gray-500 font-medium`}>Nerecenzován</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1">
      <Star className={`${iconSize} fill-yellow-400 text-yellow-400`} />
      {showText && (
        <>
          <span className={`${textSize} font-medium`}>{rating.toFixed(1)}</span>
          <span className={`${textSize} text-gray-500`}>
            ({reviewCount} {reviewCount === 1 ? "hodnocení" : "hodnocení"})
          </span>
        </>
      )}
    </div>
  )
}

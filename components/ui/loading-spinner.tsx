import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  fullPage?: boolean
  text?: string
  className?: string
}

const sizeClasses = {
  sm: "h-6 w-6 border-2",
  md: "h-12 w-12 border-2",
  lg: "h-16 w-16 border-4",
}

export default function LoadingSpinner({
  size = "md",
  fullPage = false,
  text,
  className
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-b-blue-600",
          sizeClasses[size]
        )}
      />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

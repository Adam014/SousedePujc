"use client"

import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"

interface ActivityIndicatorProps {
  lastSeen?: string
  isOnline?: boolean
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export default function ActivityIndicator({
  lastSeen,
  isOnline = false,
  size = "md",
  showText = false,
}: ActivityIndicatorProps) {
  const isRecentlyActive = lastSeen && new Date(lastSeen) > new Date(Date.now() - 5 * 60 * 1000) // 5 minut

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  const getActivityStatus = () => {
    if (isOnline) return { color: "bg-green-500", text: "Online" }
    if (isRecentlyActive) return { color: "bg-green-400", text: "Aktivní" }
    if (lastSeen) {
      const timeAgo = formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: cs })
      return { color: "bg-gray-400", text: `Aktivní ${timeAgo}` }
    }
    return { color: "bg-gray-400", text: "Offline" }
  }

  const status = getActivityStatus()

  return (
    <div className="flex items-center gap-1">
      <div className={`rounded-full ${status.color} ${sizeClasses[size]} border-2 border-white`} />
      {showText && <span className="text-xs text-gray-500">{status.text}</span>}
    </div>
  )
}

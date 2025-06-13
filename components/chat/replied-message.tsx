"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatMessage } from "@/lib/types"

interface RepliedMessageProps {
  repliedMessage: ChatMessage
  onClick?: () => void
}

export default function RepliedMessage({ repliedMessage, onClick }: RepliedMessageProps) {
  return (
    <div
      className="bg-gray-50 border-l-4 border-blue-400 p-2 mb-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 mb-1">
        <Avatar className="h-4 w-4">
          <AvatarImage
            src={repliedMessage.sender?.avatar_url || "/placeholder-user.jpg"}
            alt={repliedMessage.sender?.name || ""}
          />
          <AvatarFallback className="text-xs">{repliedMessage.sender?.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-gray-600">{repliedMessage.sender?.name || "Neznámý uživatel"}</span>
      </div>
      <p className="text-xs text-gray-700 line-clamp-2">{repliedMessage.message}</p>
    </div>
  )
}

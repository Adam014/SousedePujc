"use client"

import type { TypingIndicator } from "@/lib/types"

interface TypingIndicatorProps {
  typingUsers: TypingIndicator[]
}

export default function TypingIndicatorComponent({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  return (
    <div className="px-4 py-2 text-sm text-gray-500 italic">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
        <span>
          {typingUsers.length === 1
            ? `${typingUsers[0].user_name} píše...`
            : `${typingUsers.map((u) => u.user_name).join(", ")} píšou...`}
        </span>
      </div>
    </div>
  )
}

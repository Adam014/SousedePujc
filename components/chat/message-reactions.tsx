"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus } from "lucide-react"
import type { MessageReaction } from "@/lib/types"

interface MessageReactionsProps {
  messageId: string
  reactions: MessageReaction[]
  currentUserId: string
  onAddReaction: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction: (messageId: string, emoji: string) => Promise<void>
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🎉"]

export default function MessageReactions({
  messageId,
  reactions = [],
  currentUserId,
  onAddReaction,
  onRemoveReaction,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  // Seskupíme reakce podle emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {} as Record<string, MessageReaction[]>,
  )

  const handleEmojiClick = async (emoji: string) => {
    if (loading === emoji) return

    try {
      setLoading(emoji)
      const userReaction = reactions.find((r) => r.emoji === emoji && r.user_id === currentUserId)

      if (userReaction) {
        await onRemoveReaction(messageId, emoji)
      } else {
        await onAddReaction(messageId, emoji)
      }

      setShowEmojiPicker(false)
    } catch (error) {
      console.error("Error handling emoji click:", error)
    } finally {
      setLoading(null)
    }
  }

  const hasReactions = Object.keys(groupedReactions).length > 0

  return (
    <div className="flex items-center space-x-1 mt-1 flex-wrap">
      {/* Zobrazení existujících reakcí */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReacted = reactionList.some((r) => r.user_id === currentUserId)
        const count = reactionList.length

        return (
          <Button
            key={emoji}
            variant={hasUserReacted ? "default" : "outline"}
            size="sm"
            className={`h-6 px-2 text-xs transition-all ${
              hasUserReacted
                ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            } ${loading === emoji ? "opacity-50" : ""}`}
            onClick={() => handleEmojiClick(emoji)}
            disabled={loading === emoji}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </Button>
        )
      })}

      {/* Tlačítko pro přidání reakce */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 transition-opacity ${
              hasReactions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100 transition-colors"
                onClick={() => handleEmojiClick(emoji)}
                disabled={loading === emoji}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

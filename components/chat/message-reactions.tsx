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
  onAddReaction: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🎉"]

export default function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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

  const handleEmojiClick = (emoji: string) => {
    const userReaction = reactions.find((r) => r.emoji === emoji && r.user_id === currentUserId)

    if (userReaction) {
      onRemoveReaction(messageId, emoji)
    } else {
      onAddReaction(messageId, emoji)
    }

    setShowEmojiPicker(false)
  }

  return (
    <div className="flex items-center space-x-1 mt-1">
      {/* Zobrazení existujících reakcí */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReacted = reactionList.some((r) => r.user_id === currentUserId)
        const count = reactionList.length

        return (
          <Button
            key={emoji}
            variant={hasUserReacted ? "default" : "outline"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleEmojiClick(emoji)}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </Button>
        )
      })}

      {/* Tlačítko pro přidání reakce */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
                className="h-8 w-8 p-0 text-lg"
                onClick={() => handleEmojiClick(emoji)}
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

"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ChatMessage } from "@/lib/types"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseRealtimeChatProps {
  roomId: string
  userId: string
  onNewMessage?: (message: ChatMessage) => void
  onMessageUpdate?: (message: ChatMessage) => void
  onMessageDelete?: (messageId: string) => void
}

export function useRealtimeChat({
  roomId,
  userId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
}: UseRealtimeChatProps) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!roomId || !userId) return

    // Vytvoříme nový kanál
    const channel = supabase.channel(`chat-room-${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    })

    // Nasloucháme změnám v databázi
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log("New message received:", payload)
          const newMessage = payload.new as ChatMessage

          // Získáme data odesílatele
          const { data: sender } = await supabase.from("users").select("*").eq("id", newMessage.sender_id).single()

          const messageWithSender = { ...newMessage, sender }
          onNewMessage?.(messageWithSender)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log("Message updated:", payload)
          const updatedMessage = payload.new as ChatMessage

          // Získáme data odesílatele
          const { data: sender } = await supabase.from("users").select("*").eq("id", updatedMessage.sender_id).single()

          const messageWithSender = { ...updatedMessage, sender }
          onMessageUpdate?.(messageWithSender)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Message deleted:", payload)
          onMessageDelete?.(payload.old.id)
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status)
        setIsConnected(status === "SUBSCRIBED")
      })

    channelRef.current = channel

    return () => {
      console.log("Unsubscribing from channel")
      channel.unsubscribe()
      setIsConnected(false)
    }
  }, [roomId, userId, onNewMessage, onMessageUpdate, onMessageDelete])

  return { isConnected }
}

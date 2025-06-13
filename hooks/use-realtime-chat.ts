"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { db } from "@/lib/database"
import type { ChatMessage, TypingIndicator } from "@/lib/types"

export function useRealtimeChat(roomId: string, userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Načtení zpráv při inicializaci
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true)
        const messagesData = await db.getChatMessagesByRoom(roomId)
        setMessages(messagesData)
      } catch (error) {
        console.error("Error loading messages:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [roomId])

  // Nastavení realtime subscription
  useEffect(() => {
    if (!roomId || !userId) return

    console.log("Setting up realtime subscription for room:", roomId)

    // Vytvoříme kanál pro tuto místnost
    const channel = supabase.channel(`room:${roomId}`, {
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
          const sender = await db.getUserById(newMessage.sender_id)
          const messageWithSender = { ...newMessage, sender }

          setMessages((prev) => {
            // Kontrola duplicit
            const exists = prev.some((msg) => msg.id === messageWithSender.id)
            if (exists) return prev
            return [...prev, messageWithSender]
          })

          // Označíme zprávu jako přečtenou pokud není naše
          if (newMessage.sender_id !== userId) {
            await db.markChatMessagesAsRead(roomId, userId)
          }
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
          const sender = await db.getUserById(updatedMessage.sender_id)
          const messageWithSender = { ...updatedMessage, sender }

          setMessages((prev) => prev.map((msg) => (msg.id === messageWithSender.id ? messageWithSender : msg)))
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
          const deletedMessage = payload.old as ChatMessage
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id))
        },
      )
      // Nasloucháme typing indikátorům
      .on("broadcast", { event: "typing" }, (payload) => {
        console.log("Typing event received:", payload)
        const typingData = payload.payload as TypingIndicator

        if (typingData.user_id !== userId) {
          setTypingUsers((prev) => {
            const filtered = prev.filter((t) => t.user_id !== typingData.user_id)
            return [...filtered, typingData]
          })

          // Odstraníme typing indikátor po 3 sekundách
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((t) => t.user_id !== typingData.user_id))
          }, 3000)
        }
      })
      .on("broadcast", { event: "stop_typing" }, (payload) => {
        console.log("Stop typing event received:", payload)
        const typingData = payload.payload as TypingIndicator
        setTypingUsers((prev) => prev.filter((t) => t.user_id !== typingData.user_id))
      })
      .subscribe((status) => {
        console.log("Subscription status:", status)
      })

    channelRef.current = channel

    return () => {
      console.log("Cleaning up realtime subscription")
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [roomId, userId])

  // Funkce pro odeslání zprávy
  const sendMessage = async (messageText: string, attachmentData?: any) => {
    try {
      const result = await db.sendChatMessage({
        room_id: roomId,
        sender_id: userId,
        message: messageText,
        ...attachmentData,
      })

      return result
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  // Funkce pro editaci zprávy
  const editMessage = async (messageId: string, newText: string) => {
    try {
      const result = await db.updateChatMessage(messageId, newText)
      return result
    } catch (error) {
      console.error("Error editing message:", error)
      throw error
    }
  }

  // Funkce pro smazání zprávy
  const deleteMessage = async (messageId: string) => {
    try {
      await db.deleteChatMessage(messageId)
    } catch (error) {
      console.error("Error deleting message:", error)
      throw error
    }
  }

  // Funkce pro typing indikátor
  const sendTypingIndicator = (userName: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          room_id: roomId,
          user_id: userId,
          user_name: userName,
          timestamp: Date.now(),
        },
      })

      // Automaticky zastavíme typing po 3 sekundách
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTypingIndicator()
      }, 3000)
    }
  }

  const stopTypingIndicator = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "stop_typing",
        payload: {
          room_id: roomId,
          user_id: userId,
          timestamp: Date.now(),
        },
      })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  return {
    messages,
    typingUsers,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingIndicator,
    stopTypingIndicator,
  }
}

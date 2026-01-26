"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { db } from "@/lib/database"
import type { ChatMessage, TypingIndicator } from "@/lib/types"

interface SendMessageOptions {
  attachment_url?: string
  attachment_name?: string
  attachment_type?: string
}

export function useRealtimeChat(roomId: string, currentUserId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)

  // Načtení zpráv
  const loadMessages = useCallback(async () => {
    if (!roomId) return

    try {
      setLoading(true)
      const messagesData = await db.getChatMessagesByRoom(roomId)
      setMessages(messagesData)
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  // Inicializace realtime připojení
  useEffect(() => {
    if (!roomId || !currentUserId) return

    loadMessages()

    // Vytvoření realtime kanálu
    const channel = supabase.channel(`chat-room-${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: currentUserId },
      },
    })

    // Poslouchání změn v chat_messages
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

          // Načteme kompletní zprávu s relacemi
          try {
            const { data: newMessage, error } = await supabase
              .from("chat_messages")
              .select(`
                *,
                sender:users(*),
                reactions:message_reactions(
                  *,
                  user:users(*)
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (error) {
              console.error("Error fetching new message:", error)
              return
            }

            // Pokud má reply_to_id, načteme replied zprávu
            let messageWithReply = newMessage
            if (newMessage.reply_to_id) {
              const { data: repliedMessage } = await supabase
                .from("chat_messages")
                .select(`
                  id,
                  message,
                  sender_id,
                  created_at,
                  sender:users(id, name, avatar_url)
                `)
                .eq("id", newMessage.reply_to_id)
                .single()

              messageWithReply = {
                ...newMessage,
                reply_to: repliedMessage || null,
              }
            }

            setMessages((prev) => {
              // Zkontrolujeme, zda zpráva již neexistuje
              const exists = prev.some((msg) => msg.id === messageWithReply.id)
              if (exists) return prev

              return [...prev, messageWithReply]
            })
          } catch (error) {
            console.error("Error processing new message:", error)
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

          // Načteme aktualizovanou zprávu
          try {
            const { data: updatedMessage, error } = await supabase
              .from("chat_messages")
              .select(`
                *,
                sender:users(*),
                reactions:message_reactions(
                  *,
                  user:users(*)
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (error) {
              console.error("Error fetching updated message:", error)
              return
            }

            // Pokud má reply_to_id, načteme replied zprávu
            let messageWithReply = updatedMessage
            if (updatedMessage.reply_to_id) {
              const { data: repliedMessage } = await supabase
                .from("chat_messages")
                .select(`
                  id,
                  message,
                  sender_id,
                  created_at,
                  sender:users(id, name, avatar_url)
                `)
                .eq("id", updatedMessage.reply_to_id)
                .single()

              messageWithReply = {
                ...updatedMessage,
                reply_to: repliedMessage || null,
              }
            }

            setMessages((prev) => prev.map((msg) => (msg.id === messageWithReply.id ? messageWithReply : msg)))
          } catch (error) {
            console.error("Error processing updated message:", error)
          }
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
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        },
      )
      // Poslouchání změn v message_reactions
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async (payload) => {
          console.log("Reaction changed:", payload)

          // Získáme message_id z payloadu
          const messageId = payload.new?.message_id || payload.old?.message_id
          if (!messageId) return

          // Aktualizujeme pouze reakce pro konkrétní zprávu, ne všechny zprávy
          try {
            const { data: reactions, error } = await supabase
              .from("message_reactions")
              .select(`
                *,
                user:users(*)
              `)
              .eq("message_id", messageId)

            if (error) {
              console.error("Error fetching reactions:", error)
              return
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, reactions: reactions || [] }
                  : msg
              )
            )
          } catch (error) {
            console.error("Error updating reactions:", error)
          }
        },
      )
      // Broadcast pro typing indikátor
      .on("broadcast", { event: "typing" }, (payload) => {
        const { user_id, user_name, typing } = payload.payload

        if (user_id === currentUserId) return // Ignorujeme vlastní typing

        setTypingUsers((prev) => {
          if (typing) {
            // Přidáme nebo aktualizujeme typing indikátor
            const existing = prev.find((t) => t.user_id === user_id)
            if (existing) {
              return prev.map((t) => (t.user_id === user_id ? { ...t, timestamp: Date.now() } : t))
            }
            return [
              ...prev,
              {
                room_id: roomId,
                user_id,
                user_name,
                timestamp: Date.now(),
              },
            ]
          } else {
            // Odebereme typing indikátor
            return prev.filter((t) => t.user_id !== user_id)
          }
        })
      })
      .subscribe()

    channelRef.current = channel

    // Cleanup starých typing indikátorů
    const cleanupInterval = setInterval(() => {
      setTypingUsers(
        (prev) => prev.filter((t) => Date.now() - t.timestamp < 3000), // 3 sekundy
      )
    }, 1000)

    return () => {
      clearInterval(cleanupInterval)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [roomId, currentUserId, loadMessages])

  // Odeslání zprávy
  const sendMessage = async (
    message: string,
    options?: SendMessageOptions,
    replyToId?: string,
  ): Promise<{ message: ChatMessage; wasFiltered: boolean; filteredWords: string[] }> => {
    if (!currentUserId || !roomId) {
      throw new Error("Missing user ID or room ID")
    }

    const messageData = {
      room_id: roomId,
      sender_id: currentUserId,
      message,
      reply_to_id: replyToId || undefined,
      ...options,
    }

    return await db.sendChatMessage(messageData)
  }

  // Editace zprávy
  const editMessage = async (
    messageId: string,
    newText: string,
  ): Promise<{ message: ChatMessage; wasFiltered: boolean; filteredWords: string[] }> => {
    return await db.updateChatMessage(messageId, newText)
  }

  // Smazání zprávy
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    return await db.deleteChatMessage(messageId)
  }

  // Typing indikátor
  const sendTypingIndicator = (userName: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: currentUserId,
          user_name: userName,
          typing: true,
        },
      })
    }
  }

  const stopTypingIndicator = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: currentUserId,
          typing: false,
        },
      })
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

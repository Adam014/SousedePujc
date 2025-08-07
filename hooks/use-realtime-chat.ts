"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  const [hasMore, setHasMore] = useState(true)
  const channelRef = useRef<any>(null)
  const loadingRef = useRef(false)

  // Optimized message loading with pagination
  const loadMessages = useCallback(async (offset: number = 0, limit: number = 50) => {
    if (!roomId || loadingRef.current) return

    try {
      loadingRef.current = true
      if (offset === 0) setLoading(true)
      
      const messagesData = await db.getChatMessagesByRoom(roomId, limit, offset)
      
      if (offset === 0) {
        setMessages(messagesData)
      } else {
        setMessages(prev => [...messagesData, ...prev])
      }
      
      setHasMore(messagesData.length === limit)
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [roomId])

  // Load more messages (for infinite scroll)
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingRef.current) {
      loadMessages(messages.length)
    }
  }, [hasMore, messages.length, loadMessages])

  // Optimized realtime connection
  useEffect(() => {
    if (!roomId || !currentUserId) return

    loadMessages()

    const channel = supabase.channel(`chat-room-${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: currentUserId },
      },
    })

    // Optimized message handlers
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
          try {
            const { data: newMessage, error } = await supabase
              .from("chat_messages")
              .select(`
                *,
                sender:users(id, name, avatar_url),
                reactions:message_reactions(
                  *,
                  user:users(id, name, avatar_url)
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (error) {
              console.error("Error fetching new message:", error)
              return
            }

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
          try {
            const { data: updatedMessage, error } = await supabase
              .from("chat_messages")
              .select(`
                *,
                sender:users(id, name, avatar_url),
                reactions:message_reactions(
                  *,
                  user:users(id, name, avatar_url)
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (error) {
              console.error("Error fetching updated message:", error)
              return
            }

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
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async () => {
          // Reload only current messages instead of all
          const currentMessageIds = messages.map(m => m.id)
          if (currentMessageIds.length > 0) {
            try {
              const { data: updatedMessages } = await supabase
                .from("chat_messages")
                .select(`
                  id,
                  reactions:message_reactions(
                    *,
                    user:users(id, name, avatar_url)
                  )
                `)
                .in("id", currentMessageIds)

              if (updatedMessages) {
                setMessages(prev => prev.map(msg => {
                  const updated = updatedMessages.find(u => u.id === msg.id)
                  return updated ? { ...msg, reactions: updated.reactions } : msg
                }))
              }
            } catch (error) {
              console.error("Error updating reactions:", error)
            }
          }
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const { user_id, user_name, typing } = payload.payload

        if (user_id === currentUserId) return

        setTypingUsers((prev) => {
          if (typing) {
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
            return prev.filter((t) => t.user_id !== user_id)
          }
        })
      })
      .subscribe()

    channelRef.current = channel

    // Optimized cleanup interval
    const cleanupInterval = setInterval(() => {
      setTypingUsers((prev) => prev.filter((t) => Date.now() - t.timestamp < 3000))
    }, 2000) // Reduced frequency

    return () => {
      clearInterval(cleanupInterval)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [roomId, currentUserId, messages])

  const sendMessage = useCallback(async (
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
  }, [currentUserId, roomId])

  const editMessage = useCallback(async (
    messageId: string,
    newText: string,
  ): Promise<{ message: ChatMessage; wasFiltered: boolean; filteredWords: string[] }> => {
    return await db.updateChatMessage(messageId, newText)
  }, [])

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    return await db.deleteChatMessage(messageId)
  }, [])

  const sendTypingIndicator = useCallback((userName: string) => {
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
  }, [currentUserId])

  const stopTypingIndicator = useCallback(() => {
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
  }, [currentUserId])

  return {
    messages,
    typingUsers,
    loading,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingIndicator,
    stopTypingIndicator,
    loadMoreMessages,
  }
}

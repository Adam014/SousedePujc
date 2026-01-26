"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/database"
import ChatList from "@/components/chat/chat-list"
import type { ChatRoom } from "@/lib/types"
import { supabase } from "@/lib/supabase"

export default function MessagesPage() {
  const { user } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user) return

      try {
        setLoading(true)
        const rooms = await db.getChatRoomsByUser(user.id)
        setChatRooms(rooms)

        // Batch mark all messages as read (single query instead of N queries)
        const roomIds = rooms.map(room => room.id)
        await db.markAllChatRoomsAsRead(roomIds, user.id)
      } catch (error) {
        console.error("Error loading chat rooms:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChatRooms()

    // Nastavíme realtime subscription pro chat_rooms
    const channel = supabase
      .channel("chat_rooms_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
        },
        (payload) => {
          // Při jakékoliv změně v chat_rooms aktualizujeme seznam
          loadChatRooms()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Zprávy</h1>
          <p>Pro zobrazení zpráv se musíte přihlásit.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Zprávy</h1>
      <ChatList rooms={chatRooms} loading={loading} />
    </div>
  )
}

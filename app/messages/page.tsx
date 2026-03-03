"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/database"
import ChatList from "@/components/chat/chat-list"
import ChatRoom from "@/components/chat/chat-room"
import type { ChatRoom as ChatRoomType } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { MessageCircle } from "lucide-react"

export default function MessagesPage() {
  const { user } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user) return

      try {
        setLoading(true)
        const rooms = await db.getChatRoomsByUser(user.id)
        setChatRooms(rooms)
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
        () => {
          loadChatRooms()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
  }

  const handleBack = () => {
    setSelectedRoomId(null)
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-57px)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Zprávy</h1>
          <p>Pro zobrazení zpráv se musíte přihlásit.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Left sidebar - chat list */}
      <div className={`w-full md:w-[360px] md:border-r border-gray-200 flex flex-col bg-white flex-shrink-0 ${selectedRoomId ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Chaty</h1>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 messenger-scrollbar">
          <ChatList
            rooms={chatRooms}
            loading={loading}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
          />
        </div>
      </div>

      {/* Right panel - active chat or empty state */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedRoomId ? "flex" : "hidden md:flex"}`}>
        {selectedRoomId ? (
          <ChatRoom
            key={selectedRoomId}
            roomId={selectedRoomId}
            isInline={true}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">Vaše zprávy</h2>
              <p className="text-gray-500 text-sm">Vyberte konverzaci ze seznamu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

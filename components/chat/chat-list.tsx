"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import type { ChatRoom } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"
import { supabase } from "@/lib/supabase"

interface ChatListProps {
  rooms: ChatRoom[]
  loading: boolean
  selectedRoomId?: string | null
  onSelectRoom?: (roomId: string) => void
}

export default function ChatList({ rooms, loading, selectedRoomId, onSelectRoom }: ChatListProps) {
  const { user } = useAuth()
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Stabilní reference na room IDs pro dependency array
  const roomIds = useMemo(() => rooms.map(r => r.id).sort().join(','), [rooms])

  // Načtení počtu nepřečtených zpráv pro každou místnost
  useEffect(() => {
    if (!user || rooms.length === 0) return

    let isMounted = true

    const loadUnreadCounts = async () => {
      const counts: Record<string, number> = {}

      for (const room of rooms) {
        try {
          const { count, error } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .neq("sender_id", user.id)
            .eq("is_read", false)

          if (error) {
            console.error(`Error counting unread messages for room ${room.id}:`, error)
            counts[room.id] = 0
          } else {
            counts[room.id] = count ?? 0
          }
        } catch (error) {
          console.error(`Error counting unread messages for room ${room.id}:`, error)
          counts[room.id] = 0
        }
      }

      if (isMounted) {
        setUnreadCounts(counts)
      }
    }

    loadUnreadCounts()

    // Nastavíme realtime subscription pro chat_messages
    const channel = supabase
      .channel(`chat_list_unread_counter_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        () => {
          if (isMounted) {
            loadUnreadCounts()
          }
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user, roomIds]) // Use stable roomIds instead of rooms array

  // Funkce pro získání druhého uživatele v konverzaci
  const getOtherUser = (room: ChatRoom) => {
    if (!user) return null
    return user.id === room.owner_id ? room.borrower : room.owner
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Žádné konverzace</h3>
        <p className="text-gray-500 text-sm">Zatím nemáte žádné konverzace.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {rooms.map((room) => {
        const otherUser = getOtherUser(room)
        const unreadCount = unreadCounts[room.id] || 0
        const isSelected = selectedRoomId === room.id

        const rowContent = (
          <div
            className={`flex items-center px-3 py-2.5 cursor-pointer transition-colors ${
              isSelected
                ? "bg-blue-50"
                : "hover:bg-gray-100"
            }`}
          >
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={otherUser?.avatar_url || "/placeholder-user.jpg"} alt={otherUser?.name || ""} />
              <AvatarFallback className="text-sm">{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm truncate ${unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}>
                  {otherUser?.name || "Neznámý uživatel"}
                </h3>
                <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                  {room.last_message_time
                    ? formatDistanceToNow(new Date(room.last_message_time), { addSuffix: false, locale: cs })
                    : ""}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-[13px] truncate ${unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                  {room.last_message || "Žádné zprávy"}
                </p>
                {unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 ml-2 flex-shrink-0">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        )

        if (onSelectRoom) {
          return (
            <div key={room.id} onClick={() => onSelectRoom(room.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelectRoom(room.id)}>
              {rowContent}
            </div>
          )
        }

        return (
          <Link key={room.id} href={`/messages/${room.id}`} className="block">
            {rowContent}
          </Link>
        )
      })}
    </div>
  )
}

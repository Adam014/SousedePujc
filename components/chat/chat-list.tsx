"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import type { ChatRoom } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"
import { supabase } from "@/lib/supabase"

interface ChatListProps {
  rooms: ChatRoom[]
  loading: boolean
}

export default function ChatList({ rooms, loading }: ChatListProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Načtení počtu nepřečtených zpráv pro každou místnost
  useEffect(() => {
    if (!user || rooms.length === 0) return

    const loadUnreadCounts = async () => {
      const counts: Record<string, number> = {}

      for (const room of rooms) {
        try {
          const { data, error } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .neq("sender_id", user.id)
            .eq("is_read", false)

          if (error) {
            console.error(`Error counting unread messages for room ${room.id}:`, error)
            counts[room.id] = 0
          } else {
            counts[room.id] = data || 0
          }
        } catch (error) {
          console.error(`Error counting unread messages for room ${room.id}:`, error)
          counts[room.id] = 0
        }
      }

      setUnreadCounts(counts)
    }

    loadUnreadCounts()

    // Nastavíme realtime subscription pro chat_messages
    const channel = supabase
      .channel("chat_list_unread_counter")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          // Při jakékoliv změně v chat_messages aktualizujeme počty nepřečtených zpráv
          loadUnreadCounts()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, rooms])

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
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Žádné konverzace</h3>
        <p className="text-gray-500 text-sm">Zatím nemáte žádné konverzace.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {rooms.map((room) => {
        const otherUser = getOtherUser(room)
        const unreadCount = unreadCounts[room.id] || 0

        return (
          <Link key={room.id} href={`/messages/${room.id}`} className="block">
            <Card className={`hover:shadow-md transition-shadow ${unreadCount > 0 ? "bg-blue-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser?.avatar_url || "/placeholder-user.jpg"} alt={otherUser?.name || ""} />
                    <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{otherUser?.name || "Neznámý uživatel"}</h3>
                      <span className="text-xs text-gray-500">
                        {room.last_message_time
                          ? formatDistanceToNow(new Date(room.last_message_time), { addSuffix: true, locale: cs })
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate max-w-[70%]">
                        {room.last_message || "Žádné zprávy"}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{room.item?.title || ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

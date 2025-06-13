"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import type { ChatRoom } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"
import { MessageSquare } from "lucide-react"

export default function ChatList() {
  const { user } = useAuth()
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

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
  }, [user])

  const getOtherUser = (room: ChatRoom) => {
    if (!user) return null
    return user.id === room.owner_id ? room.borrower : room.owner
  }

  const handleRoomClick = (roomId: string) => {
    router.push(`/messages/${roomId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (chatRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Žádné konverzace</h3>
        <p className="mt-1 text-sm text-gray-500">
          Zatím nemáte žádné konverzace. Konverzace se vytvoří automaticky při rezervaci předmětu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {chatRooms.map((room) => {
        const otherUser = getOtherUser(room)
        const isOwner = user?.id === room.owner_id
        const lastMessageTime = room.last_message_time
          ? formatDistanceToNow(new Date(room.last_message_time), { addSuffix: true, locale: cs })
          : "Žádné zprávy"

        return (
          <Card
            key={room.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleRoomClick(room.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser?.avatar_url || "/placeholder-user.jpg"} alt={otherUser?.name || ""} />
                  <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium">{otherUser?.name || "Neznámý uživatel"}</h3>
                    <span className="text-xs text-gray-500">{lastMessageTime}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                      {room.item?.title || "Předmět není k dispozici"}
                    </p>
                    <span className="text-xs text-gray-500">{isOwner ? "Vy půjčujete" : "Vy si půjčujete"}</span>
                  </div>
                  {room.last_message && <p className="text-sm text-gray-700 truncate mt-1">{room.last_message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/database"
import type { ChatRoom as ChatRoomType } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, X } from "lucide-react"
import ChatRoom from "./chat-room"
import { useRouter } from "next/navigation"
// Přidat import pro ActivityIndicator
import ActivityIndicator from "@/components/ui/activity-indicator"

export default function ChatPopup() {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([])
  const [loading, setLoading] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const popupRef = useRef<HTMLDivElement>(null)

  // Načtení chat roomů
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user) return

      try {
        setLoading(true)
        const rooms = await db.getChatRoomsByUser(user.id)
        setChatRooms(rooms)

        // Načtení počtu nepřečtených zpráv
        const count = await db.getUnreadMessageCount(user.id)
        setUnreadMessages(count)
      } catch (error) {
        console.error("Error loading chat rooms:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadChatRooms()
    }

    // Nastavení intervalu pro pravidelnou kontrolu nových zpráv
    const interval = setInterval(() => {
      if (user) {
        loadChatRooms()
      }
    }, 30000) // každých 30 sekund

    return () => clearInterval(interval)
  }, [user])

  // Zavření popup při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const togglePopup = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setActiveChatId(null)
    }
  }

  const openChat = (roomId: string) => {
    setActiveChatId(roomId)
  }

  const closeChat = () => {
    setActiveChatId(null)
  }

  const getOtherUser = (room: ChatRoomType) => {
    if (!user) return null
    return user.id === room.owner_id ? room.borrower : room.owner
  }

  const handleViewAllMessages = () => {
    router.push("/messages")
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={popupRef}>
      {/* Aktivní chat */}
      {isOpen && activeChatId && (
        <div className="mb-4">
          <ChatRoom roomId={activeChatId} isPopup={true} onClose={closeChat} />
        </div>
      )}

      {/* Seznam chatů */}
      {isOpen && !activeChatId && (
        <Card className="w-80 max-h-96 overflow-hidden mb-4 shadow-lg">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">Zprávy</h3>
            <Button variant="ghost" size="sm" onClick={togglePopup}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">Zatím nemáte žádné konverzace</div>
            ) : (
              chatRooms.map((room) => {
                const otherUser = getOtherUser(room)
                return (
                  <div
                    key={room.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                    onClick={() => openChat(room.id)}
                  >
                    {/* V části kde se renderuje seznam chatů, aktualizovat zobrazení uživatele: */}
                    <div className="flex items-center">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={otherUser?.avatar_url || "/placeholder-user.jpg"}
                            alt={otherUser?.name || ""}
                          />
                          <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1">
                          <ActivityIndicator lastSeen={otherUser?.last_seen} size="sm" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm truncate">{otherUser?.name || "Neznámý uživatel"}</p>
                          <ActivityIndicator lastSeen={otherUser?.last_seen} showText size="sm" />
                        </div>
                        <p className="text-xs text-gray-500 truncate">{room.last_message || "Žádné zprávy"}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="p-2 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={handleViewAllMessages}>
              Zobrazit všechny zprávy
            </Button>
          </div>
        </Card>
      )}

      {/* Tlačítko pro otevření chatu */}
      <Button onClick={togglePopup} className="rounded-full h-14 w-14 shadow-lg flex items-center justify-center">
        <MessageSquare className="h-6 w-6" />
        {unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
      </Button>
    </div>
  )
}

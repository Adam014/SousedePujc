"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import type { ChatRoom as ChatRoomType, ChatMessage, User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface ChatRoomProps {
  roomId: string
  isPopup?: boolean
  onClose?: () => void
}

export default function ChatRoom({ roomId, isPopup = false, onClose }: ChatRoomProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [room, setRoom] = useState<ChatRoomType | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  // Funkce pro získání druhého uživatele v konverzaci
  const getOtherUser = (): User | null => {
    if (!user || !room) return null
    return user.id === room.owner_id ? room.borrower : room.owner
  }

  // Načtení dat místnosti a zpráv
  useEffect(() => {
    const loadRoomData = async () => {
      if (!user) return

      try {
        setLoading(true)
        const roomData = await db.getChatRoomById(roomId)
        if (!roomData) {
          if (!isPopup) router.push("/messages")
          return
        }
        setRoom(roomData)

        const messagesData = await db.getChatMessagesByRoom(roomId)
        setMessages(messagesData)

        // Označit zprávy jako přečtené
        await db.markChatMessagesAsRead(roomId, user.id)
      } catch (error) {
        console.error("Error loading chat room data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRoomData()
  }, [roomId, user, router, isPopup])

  // Nastavení realtime subscription pro nové zprávy
  useEffect(() => {
    if (!user || !roomId) return

    const subscription = db.subscribeToMessages(roomId, async (newMessage) => {
      // Pokud je odesílatel někdo jiný, označíme zprávu jako přečtenou
      if (newMessage.sender_id !== user.id) {
        await db.markChatMessagesAsRead(roomId, user.id)
      }

      // Získáme kompletní data odesílatele
      const sender = await db.getUserById(newMessage.sender_id)
      setMessages((prev) => [...prev, { ...newMessage, sender }])
    })

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [roomId, user])

  // Automatické scrollování na konec zpráv
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Odeslání nové zprávy
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !room || !newMessage.trim()) return

    try {
      setSending(true)
      await db.sendChatMessage({
        room_id: roomId,
        sender_id: user.id,
        message: newMessage.trim(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Konverzace nenalezena</h3>
        {!isPopup && (
          <Button className="mt-4" onClick={() => router.push("/messages")}>
            Zpět na seznam konverzací
          </Button>
        )}
        {isPopup && onClose && (
          <Button className="mt-4" onClick={onClose}>
            Zavřít
          </Button>
        )}
      </div>
    )
  }

  const otherUser = getOtherUser()

  return (
    <Card className={`flex flex-col ${isPopup ? "h-[400px] w-[350px] shadow-lg" : "h-[calc(100vh-200px)]"}`}>
      <CardHeader className="border-b py-3">
        <div className="flex items-center">
          {!isPopup && (
            <Button variant="ghost" size="icon" onClick={() => router.push("/messages")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {isPopup && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUser?.avatar_url || "/placeholder-user.jpg"} alt={otherUser?.name || ""} />
            <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1">
            <CardTitle className="text-sm">{otherUser?.name || "Neznámý uživatel"}</CardTitle>
            <CardDescription className="text-xs truncate">
              {room.item?.title || "Předmět není k dispozici"}
            </CardDescription>
          </div>
          {isPopup && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Zatím zde nejsou žádné zprávy. Začněte konverzaci!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === user?.id
            return (
              <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: cs })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="border-t p-2">
        <form onSubmit={handleSendMessage} className="flex items-center w-full">
          <Input
            className="flex-1 mr-2"
            placeholder="Zadejte zprávu..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

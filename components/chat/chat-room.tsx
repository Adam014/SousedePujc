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
import type { RealtimeChannel } from "@supabase/supabase-js"

interface ChatRoomProps {
  roomId: string
}

export default function ChatRoom({ roomId }: ChatRoomProps) {
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
          router.push("/messages")
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
  }, [roomId, user, router])

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
        <Button className="mt-4" onClick={() => router.push("/messages")}>
          Zpět na seznam konverzací
        </Button>
      </div>
    )
  }

  const otherUser = getOtherUser()

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/messages")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url || "/placeholder-user.jpg"} alt={otherUser?.name || ""} />
            <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <CardTitle className="text-base">{otherUser?.name || "Neznámý uživatel"}</CardTitle>
            <CardDescription className="text-xs">{room.item?.title || "Předmět není k dispozici"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">{/* Zde by měly být zprávy */}</CardContent>
      <CardFooter className="border-t">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <Input
            className="flex-1 mr-2"
            placeholder="Zadejte zprávu..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" disabled={sending}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

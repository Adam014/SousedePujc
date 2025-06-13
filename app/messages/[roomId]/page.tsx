"use client"

import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import ChatRoom from "@/components/chat/chat-room"
import { Card, CardContent } from "@/components/ui/card"

export default function ChatRoomPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const roomId = params.roomId as string

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-700 font-medium">Pro zobrazení zpráv se musíte přihlásit</p>
            <div className="mt-4 flex justify-center space-x-4">
              <a href="/login" className="text-blue-600 hover:underline">
                Přihlásit se
              </a>
              <a href="/register" className="text-blue-600 hover:underline">
                Registrovat se
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChatRoom roomId={roomId} />
    </div>
  )
}

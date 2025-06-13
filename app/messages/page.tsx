"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import ChatList from "@/components/chat/chat-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading])

  if (loading || authLoading) {
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
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Zprávy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChatList />
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import type { ChatRoom as ChatRoomType, User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, MoreVertical, Edit, Trash2, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import MessageInput from "./message-input"
import MessageAttachment from "./message-attachment"
import MessageReactions from "./message-reactions"
import TypingIndicatorComponent from "./typing-indicator"
import ContentWarning from "./content-warning"
import { Input } from "@/components/ui/input"
import { useRealtimeChat } from "@/hooks/use-realtime-chat"

interface ChatRoomProps {
  roomId: string
  isPopup?: boolean
  onClose?: () => void
}

export default function ChatRoom({ roomId, isPopup = false, onClose }: ChatRoomProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [room, setRoom] = useState<ChatRoomType | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessageText, setEditedMessageText] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [showContentWarning, setShowContentWarning] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Použijeme nový realtime hook
  const {
    messages,
    typingUsers,
    loading: messagesLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingIndicator,
    stopTypingIndicator,
  } = useRealtimeChat(roomId, user?.id || "")

  // Funkce pro získání druhého uživatele v konverzaci
  const getOtherUser = (): User | null => {
    if (!user || !room) return null
    return user.id === room.owner_id ? room.borrower : room.owner
  }

  // Načtení dat místnosti
  useEffect(() => {
    const loadRoomData = async () => {
      if (!user) return

      try {
        setRoomLoading(true)
        const roomData = await db.getChatRoomById(roomId)
        if (!roomData) {
          if (!isPopup) router.push("/messages")
          return
        }
        setRoom(roomData)

        // Označit zprávy jako přečtené
        await db.markChatMessagesAsRead(roomId, user.id)

        // Aktualizovat last_seen
        await db.updateUserLastSeen(user.id)
      } catch (error) {
        console.error("Error loading chat room data:", error)
      } finally {
        setRoomLoading(false)
      }
    }

    loadRoomData()
  }, [roomId, user, router, isPopup])

  // Automatické scrollování na konec zpráv
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Zaměření na input při editaci
  useEffect(() => {
    if (editingMessageId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingMessageId])

  // Typing indikátor při psaní
  const handleInputChange = (value: string) => {
    setNewMessage(value)

    if (user && value.trim()) {
      sendTypingIndicator(user.name)

      // Resetujeme timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Zastavíme typing po 1 sekundě nečinnosti
      typingTimeoutRef.current = setTimeout(() => {
        stopTypingIndicator()
      }, 1000)
    } else {
      stopTypingIndicator()
    }
  }

  // Odeslání nové zprávy
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !room || !newMessage.trim()) return

    try {
      setSending(true)
      stopTypingIndicator()

      const result = await sendMessage(newMessage.trim())

      // Zobrazit varování pokud byl obsah filtrován
      if (result.wasFiltered) {
        setShowContentWarning(true)
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  // Odeslání zprávy s přílohou
  const handleFileUpload = async (fileUrl: string, fileName: string, fileType: string) => {
    if (!user || !room) return

    try {
      setSending(true)

      const result = await sendMessage(fileName, {
        attachment_url: fileUrl,
        attachment_name: fileName,
        attachment_type: fileType,
      })

      console.log("File sent:", result)
    } catch (error) {
      console.error("Error sending file:", error)
    } finally {
      setSending(false)
    }
  }

  // Zahájení editace zprávy
  const startEditMessage = (message: any) => {
    setEditingMessageId(message.id)
    setEditedMessageText(message.message)
  }

  // Uložení editované zprávy
  const saveEditedMessage = async () => {
    if (!editingMessageId || !editedMessageText.trim()) return

    try {
      const result = await editMessage(editingMessageId, editedMessageText)

      // Zobrazit varování pokud byl obsah filtrován
      if (result.wasFiltered) {
        setShowContentWarning(true)
      }
    } catch (error) {
      console.error("Error updating message:", error)
    } finally {
      setEditingMessageId(null)
      setEditedMessageText("")
    }
  }

  // Zrušení editace zprávy
  const cancelEditMessage = () => {
    setEditingMessageId(null)
    setEditedMessageText("")
  }

  // Otevření dialogu pro smazání zprávy
  const openDeleteDialog = (messageId: string) => {
    setMessageToDelete(messageId)
    setDeleteDialogOpen(true)
  }

  // Smazání zprávy
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return

    try {
      await deleteMessage(messageToDelete)
    } catch (error) {
      console.error("Error deleting message:", error)
    } finally {
      setMessageToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  // Přidání reakce na zprávu
  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user) return

    try {
      await db.addMessageReaction(messageId, user.id, emoji)
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  // Odstranění reakce ze zprávy
  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user) return

    try {
      await db.removeMessageReaction(messageId, user.id, emoji)
    } catch (error) {
      console.error("Error removing reaction:", error)
    }
  }

  if (roomLoading || messagesLoading) {
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
    <Card className={`flex flex-col relative ${isPopup ? "h-[500px] w-[400px] shadow-xl" : "h-[calc(100vh-200px)]"}`}>
      <ContentWarning show={showContentWarning} onClose={() => setShowContentWarning(false)} />

      <CardHeader className="border-b py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center">
          {!isPopup && (
            <Button variant="ghost" size="icon" onClick={() => router.push("/messages")} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {isPopup && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url || "/placeholder-user.jpg"} alt={otherUser?.name || ""} />
            <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>

          <div className="ml-3 flex-1">
            <CardTitle className="text-base font-semibold">{otherUser?.name || "Neznámý uživatel"}</CardTitle>
            <CardDescription className="text-sm truncate">
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

      <CardContent className="flex-1 overflow-y-auto p-0">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-gray-500 text-sm">Zatím zde nejsou žádné zprávy.</p>
            <p className="text-gray-400 text-xs mt-1">Začněte konverzaci!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === user?.id
              const isEditing = message.id === editingMessageId
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id
              const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== message.sender_id

              return (
                <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    {showAvatar && !isCurrentUser && (
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={message.sender?.avatar_url || "/placeholder-user.jpg"}
                          alt={message.sender?.name || ""}
                        />
                        <AvatarFallback>{message.sender?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`${!showAvatar && !isCurrentUser ? "ml-10" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 group ${
                          isCurrentUser
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        } ${isLastInGroup ? "" : "mb-1"}`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col space-y-2">
                            <Input
                              ref={inputRef}
                              value={editedMessageText}
                              onChange={(e) => setEditedMessageText(e.target.value)}
                              className="text-black text-sm border-0 bg-white"
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditMessage}
                                className="h-6 px-2 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Zrušit
                              </Button>
                              <Button
                                size="sm"
                                onClick={saveEditedMessage}
                                className="h-6 px-2 text-xs"
                                disabled={!editedMessageText.trim()}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Uložit
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm leading-relaxed">{message.message}</p>

                            {/* Zobrazení příloh */}
                            {message.attachment_url && message.attachment_name && message.attachment_type && (
                              <MessageAttachment
                                fileUrl={message.attachment_url}
                                fileName={message.attachment_name}
                                fileType={message.attachment_type}
                              />
                            )}

                            {isCurrentUser && (
                              <div className="flex items-center justify-end mt-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 text-blue-100 hover:text-white"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startEditMessage(message)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Upravit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openDeleteDialog(message.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Smazat
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Reakce na zprávy */}
                      <MessageReactions
                        messageId={message.id}
                        reactions={message.reactions || []}
                        currentUserId={user?.id || ""}
                        onAddReaction={handleAddReaction}
                        onRemoveReaction={handleRemoveReaction}
                      />

                      {isLastInGroup && (
                        <div className={`flex items-center mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: cs })}
                            {message.is_edited && " • upraveno"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing indikátor */}
            <TypingIndicatorComponent typingUsers={typingUsers} />

            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      <MessageInput
        value={newMessage}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={sending}
        placeholder="Zadejte zprávu..."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat zprávu</AlertDialogTitle>
            <AlertDialogDescription>Opravdu chcete smazat tuto zprávu? Tato akce je nevratná.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>Smazat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

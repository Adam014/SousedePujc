"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import type { ChatRoom as ChatRoomType, User, ChatMessage } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, MoreVertical, Edit, Trash2, Check, X, Reply } from "lucide-react"
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
import MessageReply from "./message-reply"
import RepliedMessage from "./replied-message"
import TypingIndicatorComponent from "./typing-indicator"
import ContentWarning from "./content-warning"
import { Input } from "@/components/ui/input"
import { useRealtimeChat } from "@/hooks/use-realtime-chat"

interface ChatRoomProps {
  roomId: string
  isPopup?: boolean
  isInline?: boolean
  onClose?: () => void
  onBack?: () => void
}

export default function ChatRoom({ roomId, isPopup = false, isInline = false, onClose, onBack }: ChatRoomProps) {
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
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Použijeme realtime hook
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
          if (!isPopup && !isInline) router.push("/messages")
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
  }, [roomId, user, router, isPopup, isInline])

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

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

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

      const result = await sendMessage(newMessage.trim(), undefined, replyToMessage?.id)

      // Zobrazit varování pokud byl obsah filtrován
      if (result.wasFiltered) {
        setShowContentWarning(true)
      }

      setNewMessage("")
      setReplyToMessage(null)
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

      const result = await sendMessage(
        fileName,
        {
          attachment_url: fileUrl,
          attachment_name: fileName,
          attachment_type: fileType,
        },
        replyToMessage?.id,
      )

      console.log("File sent:", result)
      setReplyToMessage(null)
    } catch (error) {
      console.error("Error sending file:", error)
    } finally {
      setSending(false)
    }
  }

  // Zahájení editace zprávy
  const startEditMessage = (message: ChatMessage) => {
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

  // Nastavení reply zprávy
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyToMessage(message)
  }

  // Zrušení reply
  const handleCancelReply = () => {
    setReplyToMessage(null)
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

  // Scroll na replied zprávu
  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" })
      messageElement.classList.add("bg-yellow-100")
      setTimeout(() => {
        messageElement.classList.remove("bg-yellow-100")
      }, 2000)
    }
  }

  // Bubble radius helper for messenger-style grouping
  const getBubbleRadius = (isCurrentUser: boolean, isFirst: boolean, isLast: boolean) => {
    if (isFirst && isLast) {
      // Single message - full rounds
      return "rounded-2xl"
    }
    if (isCurrentUser) {
      if (isFirst) return "rounded-2xl rounded-br-md"
      if (isLast) return "rounded-2xl rounded-tr-md"
      return "rounded-2xl rounded-r-md"
    } else {
      if (isFirst) return "rounded-2xl rounded-bl-md"
      if (isLast) return "rounded-2xl rounded-tl-md"
      return "rounded-2xl rounded-l-md"
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
        {!isPopup && !isInline && (
          <Button className="mt-4" onClick={() => router.push("/messages")}>
            Zpět na seznam konverzací
          </Button>
        )}
        {isPopup && onClose && (
          <Button className="mt-4" onClick={onClose}>
            Zavřít
          </Button>
        )}
        {isInline && onBack && (
          <Button className="mt-4" onClick={onBack}>
            Zpět
          </Button>
        )}
      </div>
    )
  }

  const otherUser = getOtherUser()

  // Determine wrapper and height based on mode
  const wrapperClass = isPopup
    ? "h-[500px] w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] shadow-xl"
    : isInline
      ? "h-full"
      : "h-[calc(100vh-57px)]"

  const headerContent = (
    <div className="flex items-center">
      {/* Back button: standalone -> /messages, popup -> onClose, inline -> onBack (mobile) */}
      {!isPopup && !isInline && (
        <Button variant="ghost" size="icon" onClick={() => router.push("/messages")} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      {isPopup && onClose && (
        <Button variant="ghost" size="icon" onClick={onClose} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      {isInline && onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-3 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      <Avatar className="h-10 w-10">
        <AvatarImage src={otherUser?.avatar_url || "/placeholder-user.jpg"} alt={otherUser?.name || ""} />
        <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>

      <div className="ml-3 flex-1">
        <div className="text-base font-semibold">{otherUser?.name || "Neznámý uživatel"}</div>
        <div className="text-sm text-gray-500 truncate">
          {room.item?.title || "Předmět není k dispozici"}
        </div>
      </div>

      {isPopup && onClose && (
        <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto" aria-label="Zavřít chat">
          ×
        </Button>
      )}
    </div>
  )

  const messagesContent = (
    <>
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-gray-500 text-sm">Zatím zde nejsou žádné zprávy.</p>
          <p className="text-gray-400 text-xs mt-1">Začněte konverzaci!</p>
        </div>
      ) : (
        <div className="p-4 space-y-0.5">
          {messages.map((message, index) => {
            const isCurrentUser = message.sender_id === user?.id
            const isEditing = message.id === editingMessageId

            // Group detection
            const prevMessage = index > 0 ? messages[index - 1] : null
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
            const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id
            const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id

            const bubbleRadius = getBubbleRadius(isCurrentUser, isFirstInGroup, isLastInGroup)

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} transition-colors ${isFirstInGroup && index > 0 ? "mt-2" : ""}`}
              >
                <div className={`flex max-w-[70%] group/msg items-end ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar: show on LAST message of a group for non-current user */}
                  {!isCurrentUser && isLastInGroup ? (
                    <Avatar className="h-7 w-7 mr-2 flex-shrink-0 mb-0.5">
                      <AvatarImage
                        src={message.sender?.avatar_url || "/placeholder-user.jpg"}
                        alt={message.sender?.name || ""}
                      />
                      <AvatarFallback className="text-xs">{message.sender?.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                  ) : !isCurrentUser ? (
                    <div className="w-7 mr-2 flex-shrink-0" />
                  ) : null}

                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Bublina */}
                      <div
                        className={`px-4 py-2.5 ${bubbleRadius} ${
                          isCurrentUser
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {/* Replied zpráva */}
                        {message.reply_to && (
                          <RepliedMessage
                            repliedMessage={message.reply_to}
                            onClick={() => scrollToMessage(message.reply_to!.id)}
                          />
                        )}

                        {isEditing ? (
                          <div className="flex flex-col space-y-2">
                            <Input
                              ref={inputRef}
                              value={editedMessageText}
                              onChange={(e) => setEditedMessageText(e.target.value)}
                              className="text-black text-sm border-0 bg-white"
                            />
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="ghost" onClick={cancelEditMessage} className="h-6 px-2 text-xs">
                                <X className="h-3 w-3 mr-1" />
                                Zrušit
                              </Button>
                              <Button size="sm" onClick={saveEditedMessage} className="h-6 px-2 text-xs" disabled={!editedMessageText.trim()}>
                                <Check className="h-3 w-3 mr-1" />
                                Uložit
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[15px] leading-relaxed">{message.message}</p>

                            {message.attachment_url && message.attachment_name && message.attachment_type && (
                              <MessageAttachment
                                fileUrl={message.attachment_url}
                                fileName={message.attachment_name}
                                fileType={message.attachment_type}
                              />
                            )}
                          </>
                        )}
                      </div>

                      {/* Akční tlačítka — vedle bubliny, viditelná jen na hover */}
                      {!isEditing && (
                        <div className={`flex items-center opacity-0 group-hover/msg:opacity-100 transition-opacity ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                            onClick={() => handleReplyToMessage(message)}
                            aria-label="Odpovědět"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </Button>

                          {isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                  aria-label="Možnosti"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isCurrentUser ? "start" : "end"}>
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
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reakce — pod bublinou, jen pokud existují */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className={`mt-0.5 ${isCurrentUser ? "flex justify-end" : ""}`}>
                        <MessageReactions
                          messageId={message.id}
                          reactions={message.reactions}
                          currentUserId={user?.id || ""}
                          onAddReaction={handleAddReaction}
                          onRemoveReaction={handleRemoveReaction}
                        />
                      </div>
                    )}

                    {/* Čas — jen u poslední zprávy v grupě */}
                    {isLastInGroup && (
                      <p className={`text-[11px] text-gray-400 mt-0.5 ${isCurrentUser ? "text-right" : "text-left"}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: cs })}
                        {message.is_edited && " • upraveno"}
                      </p>
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
    </>
  )

  // === INLINE MODE (split-panel right side) ===
  if (isInline) {
    return (
      <div className={`flex flex-col ${wrapperClass} relative overflow-hidden`}>
        <ContentWarning show={showContentWarning} onClose={() => setShowContentWarning(false)} />

        {/* Simplified header without gradient */}
        <div className="border-b px-4 py-3 bg-white flex-shrink-0">
          {headerContent}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {messagesContent}
        </div>

        {/* Reply preview */}
        <MessageReply replyTo={replyToMessage} onCancelReply={handleCancelReply} />

        <MessageInput
          value={newMessage}
          onChange={handleInputChange}
          onSubmit={handleSendMessage}
          onFileUpload={handleFileUpload}
          disabled={sending}
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
      </div>
    )
  }

  // === POPUP & STANDALONE MODE (existing behavior with Card) ===
  return (
    <Card className={`flex flex-col relative overflow-hidden ${wrapperClass}`}>
      <ContentWarning show={showContentWarning} onClose={() => setShowContentWarning(false)} />

      <CardHeader className="border-b py-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        {headerContent}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
        {messagesContent}
      </CardContent>

      {/* Reply preview */}
      <MessageReply replyTo={replyToMessage} onCancelReply={handleCancelReply} />

      <MessageInput
        value={newMessage}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={sending}
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

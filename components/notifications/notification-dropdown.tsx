"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, CheckCheck } from "lucide-react"
import { useNotifications } from "@/lib/notifications"
import { useAuth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { cs } from "date-fns/locale"
import { useRouter } from "next/navigation"

export type Notification = {
  id: string
  created_at: string
  title: string
  message: string
  type: string
  is_read: boolean
}

export default function NotificationDropdown() {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id || null)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)

    // Navigace podle typu notifikace
    switch (notification.type) {
      case "booking_request":
        router.push("/profile?tab=lent-items")
        break
      case "booking_confirmed":
      case "booking_cancelled":
        router.push("/profile?tab=bookings")
        break
      case "new_message":
        router.push("/profile?tab=messages")
        break
      case "review_received":
        router.push("/profile?tab=reviews")
        break
      default:
        router.push("/profile")
    }

    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_request":
        return "📅"
      case "booking_confirmed":
        return "✅"
      case "booking_cancelled":
        return "❌"
      case "new_message":
        return "💬"
      case "review_received":
        return "⭐"
      default:
        return "🔔"
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end" forceMount>
        <div className="flex items-center justify-between p-2">
          <h4 className="font-semibold">Notifikace</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-1 text-xs">
              <CheckCheck className="h-3 w-3 mr-1" />
              Označit vše
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Žádné notifikace</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p
                        className={`text-sm font-medium truncate ${!notification.is_read ? "text-blue-600" : "text-gray-900"}`}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                    </div>

                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>

                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: cs,
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full">
                Zobrazit všechny notifikace
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, User, LogOut, Settings, Package, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/database"
import NotificationDropdown from "@/components/notifications/notification-dropdown"
import SearchAutocomplete from "@/components/search/search-autocomplete"

export default function Header() {
  const { user, logout } = useAuth()
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Načtení počtu nepřečtených zpráv
  useEffect(() => {
    if (!user) return

    const loadUnreadMessages = async () => {
      try {
        const count = await db.getUnreadMessageCount(user.id)
        setUnreadMessages(count)
      } catch (error) {
        console.error("Error loading unread messages count:", error)
      }
    }

    loadUnreadMessages()

    // Nastavení intervalu pro pravidelnou kontrolu nových zpráv
    const interval = setInterval(loadUnreadMessages, 30000) // každých 30 sekund

    return () => clearInterval(interval)
  }, [user])

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-soft group-hover:shadow-md transition-all duration-300">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              SousedePůjč
            </span>
          </Link>

          {/* Vyhledávání */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchAutocomplete className="w-full" />
          </div>

          {/* Navigace */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/items/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat předmět
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="relative" aria-label="Zprávy">
                  <Link href="/messages">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Link>
                </Button>

                <NotificationDropdown />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.name || "Uživatel"} />
                        <AvatarFallback>{user?.name ? user.name.charAt(0) : "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.name || "Uživatel"}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email || ""}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Můj profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=items">
                        <Package className="mr-2 h-4 w-4" />
                        Moje předměty
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=bookings">
                        <Settings className="mr-2 h-4 w-4" />
                        Moje rezervace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Zprávy
                        {unreadMessages > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {unreadMessages}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Settings className="mr-2 h-4 w-4" />
                          Administrace
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Odhlásit se
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Přihlásit se</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Registrovat se</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

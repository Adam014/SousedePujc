"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Menu,
  Plus,
  User,
  LogOut,
  Package,
  MessageSquare,
  Settings,
  Home,
  Search,
  Bell
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import SearchAutocomplete from "@/components/search/search-autocomplete"

interface MobileMenuProps {
  unreadMessages: number
}

export default function MobileMenu({ unreadMessages }: MobileMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const handleLinkClick = () => {
    setOpen(false)
  }

  const isActive = (path: string) => pathname === path

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden touch-target"
          aria-label="Otevřít menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">SousedePůjč</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-73px)]">
          {/* Search */}
          <div className="p-4 border-b">
            <SearchAutocomplete
              className="w-full"
              placeholder="Hledat předměty..."
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg touch-target transition-colors ${
                  isActive("/")
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Domů</span>
              </Link>

              {user && (
                <>
                  <Link
                    href="/items/new"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg touch-target transition-colors ${
                      isActive("/items/new")
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Přidat předmět</span>
                  </Link>

                  <Link
                    href="/messages"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg touch-target transition-colors ${
                      isActive("/messages")
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">Zprávy</span>
                    {unreadMessages > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg touch-target transition-colors ${
                      isActive("/profile")
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Můj profil</span>
                  </Link>

                  <Link
                    href="/profile?tab=items"
                    onClick={handleLinkClick}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg touch-target transition-colors hover:bg-gray-100"
                  >
                    <Package className="h-5 w-5" />
                    <span className="font-medium">Moje předměty</span>
                  </Link>

                  <Link
                    href="/profile?tab=bookings"
                    onClick={handleLinkClick}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg touch-target transition-colors hover:bg-gray-100"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Moje rezervace</span>
                  </Link>

                  {user.is_admin && (
                    <Link
                      href="/admin"
                      onClick={handleLinkClick}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg touch-target transition-colors ${
                        isActive("/admin")
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Administrace</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* User section at bottom */}
          <div className="border-t p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full touch-target justify-start"
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Odhlásit se
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button asChild className="w-full touch-target">
                  <Link href="/login" onClick={handleLinkClick}>
                    Přihlásit se
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full touch-target">
                  <Link href="/register" onClick={handleLinkClick}>
                    Registrovat se
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

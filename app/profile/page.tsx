"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Shield, Package, Calendar, MessageSquare, MapPin, Mail, Phone } from "lucide-react"
import type { Item, Booking, Review, ChatRoom } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import { formatDateCZ } from "@/lib/utils"
import ItemGrid from "@/components/items/item-grid"
import Link from "next/link"
import BookingCard from "@/components/bookings/booking-card"
import RatingDisplay from "@/components/ui/rating-display"
import BookingRequestCard from "@/components/bookings/booking-request-card"
import ChatList from "@/components/chat/chat-list"

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [userItems, setUserItems] = useState<Item[]>([])
  const [userBookings, setUserBookings] = useState<Booking[]>([])
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "items"

  // Přidáme state pro avatar
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    const loadUserData = async () => {
      try {
        setLoading(true)
        setError("")

        // Použijeme Promise.allSettled pro odolnost - pokud jeden dotaz selže, ostatní pokračují
        const [itemsResult, bookingsResult, reviewsResult, roomsResult] = await Promise.allSettled([
          db.getItemsByOwner(user.id),
          db.getBookingsByUser(user.id),
          db.getReviewsByUser(user.id),
          db.getChatRoomsByUser(user.id),
        ])

        // Zpracujeme výsledky - použijeme prázdné pole pokud dotaz selhal
        const items = itemsResult.status === "fulfilled" ? itemsResult.value : []
        const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : []
        const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : []
        const rooms = roomsResult.status === "fulfilled" ? roomsResult.value : []

        // Logujeme případné chyby
        if (itemsResult.status === "rejected") console.error("Error loading items:", itemsResult.reason)
        if (bookingsResult.status === "rejected") console.error("Error loading bookings:", bookingsResult.reason)
        if (reviewsResult.status === "rejected") console.error("Error loading reviews:", reviewsResult.reason)
        if (roomsResult.status === "rejected") console.error("Error loading chat rooms:", roomsResult.reason)

        setUserItems(items)
        setUserBookings(bookings)
        setUserReviews(reviews)
        setChatRooms(rooms)

        // Načteme rezervace předmětů, které vlastní uživatel
        // Toto jsou rezervace, kde je uživatel majitelem předmětu
        const itemIds = items.map((item) => item.id)
        if (itemIds.length > 0) {
          try {
            const bookingsForOwnedItems = await db.getBookingsForOwnedItems(itemIds)
            setOwnerBookings(bookingsForOwnedItems)
          } catch (error) {
            console.error("Error loading owner bookings:", error)
            setOwnerBookings([])
          }
        } else {
          setOwnerBookings([])
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Chyba při načítání dat profilu")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user, authLoading, router])

  // V useEffect nastavíme avatar
  useEffect(() => {
    if (user) {
      setCurrentAvatarUrl(user.avatar_url || null)
    }
  }, [user])

  // Memoize booking counts (currently recalculated every render)
  const ownerBookingCounts = useMemo(() => ({
    pending: ownerBookings.filter((b) => b.status === "pending").length,
    confirmed: ownerBookings.filter((b) => b.status === "confirmed").length,
    cancelled: ownerBookings.filter((b) => b.status === "cancelled").length,
  }), [ownerBookings])

  const userBookingCounts = useMemo(() => ({
    pending: userBookings.filter((b) => b.status === "pending").length,
    confirmed: userBookings.filter((b) => b.status === "confirmed").length,
  }), [userBookings])

  // Memoize sorted owner bookings
  const sortedOwnerBookings = useMemo(() => {
    return [...ownerBookings].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (b.status === "pending" && a.status !== "pending") return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [ownerBookings])

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
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Zkusit znovu</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Získáme nastavení soukromí
  const privacySettings = user.privacy_settings || {
    show_email: false,
    show_phone: false,
    show_address: false,
    show_bio: true,
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Profil header */}
      <Card className="mb-6 sm:mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 sm:block">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                <AvatarImage src={currentAvatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-xl sm:text-2xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {/* Mobile: Name and badge inline with avatar */}
              <div className="sm:hidden">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h1 className="text-xl font-bold">{user.name}</h1>
                  <Badge className={user.is_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.is_verified ? "Ověřený" : "Neověřený"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex-1">
              {/* Desktop: Name and badge */}
              <div className="hidden sm:flex items-center space-x-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
                <Badge className={user.is_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.is_verified ? "Ověřený" : "Neověřený"}
                </Badge>
              </div>

              {/* Kontaktní informace podle nastavení soukromí */}
              <div className="space-y-1 sm:space-y-2 mb-3 text-sm sm:text-base">
                {privacySettings.show_email && (
                  <p className="text-gray-600">
                    <span className="inline-flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span className="truncate">{user.email}</span>
                    </span>
                  </p>
                )}

                {user.phone && privacySettings.show_phone && (
                  <p className="text-gray-600">
                    <span className="inline-flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {user.phone}
                    </span>
                  </p>
                )}

                {user.address && privacySettings.show_address && (
                  <p className="text-gray-600">
                    <span className="inline-flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {user.address}
                    </span>
                  </p>
                )}
              </div>

              {user.bio && privacySettings.show_bio && (
                <div className="text-gray-600 mb-3 text-sm sm:text-base">
                  <p className="font-medium text-sm text-gray-500 mb-1">O mně:</p>
                  <p>{user.bio}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-base">
                <RatingDisplay rating={user.reputation_score} reviewCount={userReviews.length} size="md" />

                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span>{userItems.length} předmětů</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  <span>{userBookings.length} rezervací</span>
                </div>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full sm:w-auto touch-target">
              <Link href="/profile/edit">Upravit profil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="items" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">Moje předměty</span>
            <span className="sm:hidden">Předměty</span>
          </TabsTrigger>
          <TabsTrigger value="lent-items" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">Žádosti o zapůjčení</span>
            <span className="sm:hidden">Žádosti</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">Moje rezervace</span>
            <span className="sm:hidden">Rezervace</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2 px-2 sm:px-3">Hodnocení</TabsTrigger>
          <TabsTrigger value="messages" disabled className="relative cursor-not-allowed opacity-60 text-xs sm:text-sm py-2 px-2 sm:px-3 col-span-2 sm:col-span-1">
            <span className="flex items-center gap-1 sm:gap-2">
              Zprávy
              <Badge variant="secondary" className="text-[10px] sm:text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100 px-1 sm:px-1.5">
                WIP
              </Badge>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-semibold">Moje předměty ({userItems.length})</h2>
            <Button onClick={() => router.push("/items/new")} className="w-full sm:w-auto touch-target">
              <Package className="h-4 w-4 mr-2" />
              Přidat předmět
            </Button>
          </div>

          <ItemGrid items={userItems} />
        </TabsContent>

        <TabsContent value="lent-items" className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Žádosti o zapůjčení mých předmětů ({ownerBookings.length})</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Card className="bg-yellow-50">
                <CardContent className="p-2 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                      {ownerBookingCounts.pending}
                    </div>
                    <div className="text-xs sm:text-sm text-yellow-700">Čeká</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-2 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {ownerBookingCounts.confirmed}
                    </div>
                    <div className="text-xs sm:text-sm text-green-700">Potvrzené</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50">
                <CardContent className="p-2 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">
                      {ownerBookingCounts.cancelled}
                    </div>
                    <div className="text-xs sm:text-sm text-red-700">Zamítnuté</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {ownerBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Zatím si nikdo nepůjčil vaše předměty.</p>
                </CardContent>
              </Card>
            ) : (
              sortedOwnerBookings.map((booking) => <BookingRequestCard key={booking.id} booking={booking} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Moje rezervace ({userBookings.length})</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Card className="bg-yellow-50">
                <CardContent className="p-2 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                      {userBookingCounts.pending}
                    </div>
                    <div className="text-xs sm:text-sm text-yellow-700">Čeká na potvrzení</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-2 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {userBookingCounts.confirmed}
                    </div>
                    <div className="text-xs sm:text-sm text-green-700">Potvrzené</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {userBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Zatím nemáte žádné rezervace.</p>
                </CardContent>
              </Card>
            ) : (
              userBookings.map((booking) => <BookingCard key={booking.id} booking={booking} isOwner={false} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Hodnocení ({userReviews.length})</h2>

          <div className="space-y-4">
            {userReviews.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Zatím nemáte žádná hodnocení.</p>
                </CardContent>
              </Card>
            ) : (
              userReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.reviewer?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{review.reviewer?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{review.reviewer?.name || "Neznámý"}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDateCZ(review.created_at)}
                          </span>
                        </div>

                        {review.comment && <p className="text-gray-700">{review.comment}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Zprávy ({chatRooms.length})</h2>
          <ChatList rooms={chatRooms} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

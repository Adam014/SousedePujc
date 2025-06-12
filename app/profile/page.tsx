"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Shield, Package, Calendar, MessageSquare, MapPin } from "lucide-react"
import type { Item, Booking, Review } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import ItemGrid from "@/components/items/item-grid"
import Link from "next/link"
import BookingCard from "@/components/bookings/booking-card"
import RatingDisplay from "@/components/ui/rating-display"
import BookingRequestCard from "@/components/bookings/booking-request-card"

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [userItems, setUserItems] = useState<Item[]>([])
  const [userBookings, setUserBookings] = useState<Booking[]>([])
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "items"

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

        const [items, bookings, reviews, ownerBookings] = await Promise.all([
          db.getItemsByOwner(user.id),
          db.getBookingsByUser(user.id),
          db.getReviewsByUser(user.id),
          db.getBookingsByOwner(user.id),
        ])

        setUserItems(items)
        setUserBookings(bookings)
        setUserReviews(reviews)
        setOwnerBookings(ownerBookings)
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Chyba při načítání dat profilu")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user, authLoading, router])

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profil header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <Badge className={user.is_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.is_verified ? "Ověřený" : "Neověřený"}
                </Badge>
              </div>

              <p className="text-gray-600 mb-3">{user.email}</p>
              {user.address && (
                <p className="text-gray-600 mb-2">
                  <span className="inline-flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {user.address}
                  </span>
                </p>
              )}

              {user.bio && (
                <div className="text-gray-600 mb-3">
                  <p className="font-medium text-sm text-gray-500 mb-1">O mně:</p>
                  <p>{user.bio}</p>
                </div>
              )}

              <div className="flex items-center space-x-6">
                <RatingDisplay rating={user.reputation_score} reviewCount={userReviews.length} size="md" />

                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span>{userItems.length} předmětů</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>{userBookings.length} rezervací</span>
                </div>
              </div>
            </div>

            <Button asChild variant="outline">
              <Link href="/profile/edit">Upravit profil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="items">Moje předměty</TabsTrigger>
          <TabsTrigger value="lent-items">Půjčené předměty</TabsTrigger>
          <TabsTrigger value="bookings">Rezervace</TabsTrigger>
          <TabsTrigger value="reviews">Hodnocení</TabsTrigger>
          <TabsTrigger value="messages">Zprávy</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Moje předměty ({userItems.length})</h2>
            <Button onClick={() => router.push("/items/new")}>
              <Package className="h-4 w-4 mr-2" />
              Přidat předmět
            </Button>
          </div>

          <ItemGrid items={userItems} />
        </TabsContent>

        <TabsContent value="lent-items" className="space-y-6">
          <h2 className="text-2xl font-semibold">Žádosti o půjčení ({ownerBookings.length})</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-yellow-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {ownerBookings.filter((b) => b.status === "pending").length}
                    </div>
                    <div className="text-sm text-yellow-700">Čeká na rozhodnutí</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ownerBookings.filter((b) => b.status === "confirmed").length}
                    </div>
                    <div className="text-sm text-green-700">Potvrzené</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {ownerBookings.filter((b) => b.status === "cancelled").length}
                    </div>
                    <div className="text-sm text-red-700">Zamítnuté</div>
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
              ownerBookings
                .sort((a, b) => {
                  if (a.status === "pending" && b.status !== "pending") return -1
                  if (b.status === "pending" && a.status !== "pending") return 1
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                })
                .map((booking) => <BookingRequestCard key={booking.id} booking={booking} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <h2 className="text-2xl font-semibold">Moje rezervace ({userBookings.length})</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-yellow-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {userBookings.filter((b) => b.status === "pending").length}
                    </div>
                    <div className="text-sm text-yellow-700">Čeká na potvrzení</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {userBookings.filter((b) => b.status === "confirmed").length}
                    </div>
                    <div className="text-sm text-green-700">Potvrzené</div>
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

        <TabsContent value="reviews" className="space-y-6">
          <h2 className="text-2xl font-semibold">Hodnocení ({userReviews.length})</h2>

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
                            {new Date(review.created_at).toLocaleDateString("cs-CZ")}
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

        <TabsContent value="messages" className="space-y-6">
          <h2 className="text-2xl font-semibold">Zprávy</h2>

          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Systém zpráv bude brzy dostupný.</p>
              <p className="text-sm text-gray-400 mt-2">
                Zatím můžete kontaktovat uživatele přes telefon nebo e-mail uvedený v rezervaci.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

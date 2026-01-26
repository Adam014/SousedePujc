"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Shield, Package, MessageSquare, MapPin, Mail, Phone } from "lucide-react"
import type { User, Item, Review } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import ItemGrid from "@/components/items/item-grid"
import RatingDisplay from "@/components/ui/rating-display"

export default function UserProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userItems, setUserItems] = useState<Item[]>([])
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        setError("")

        // Načtení uživatele
        const userData = await db.getUserById(params.id as string)
        if (!userData) {
          setError("Uživatel nebyl nalezen")
          setLoading(false)
          return
        }

        setUser(userData)

        // Načtení předmětů a recenzí uživatele - použijeme Promise.allSettled pro odolnost
        const [itemsResult, reviewsResult] = await Promise.allSettled([
          db.getItemsByOwner(userData.id),
          db.getReviewsByUser(userData.id)
        ])

        // Zpracujeme výsledky - použijeme prázdné pole pokud dotaz selhal
        const items = itemsResult.status === "fulfilled" ? itemsResult.value : []
        const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : []

        // Logujeme případné chyby
        if (itemsResult.status === "rejected") console.error("Error loading items:", itemsResult.reason)
        if (reviewsResult.status === "rejected") console.error("Error loading reviews:", reviewsResult.reason)

        // Filtrujeme pouze dostupné předměty
        const availableItems = items.filter((item) => item.is_available)
        setUserItems(availableItems)
        setUserReviews(reviews)
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Chyba při načítání dat uživatele")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [params.id])

  // Kontrola, zda se jedná o vlastní profil
  const isOwnProfile = currentUser && user && currentUser.id === user.id

  if (isOwnProfile && !authLoading) {
    router.push("/profile")
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

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || "Uživatel nebyl nalezen"}</p>
            <Button onClick={() => router.push("/")}>Zpět na hlavní stránku</Button>
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
                <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
          <TabsTrigger value="items" className="text-xs sm:text-sm py-2 px-2 sm:px-3">Předměty k půjčení</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2 px-2 sm:px-3">Hodnocení</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Předměty k půjčení ({userItems.length})</h2>
          <ItemGrid items={userItems} />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Hodnocení ({userReviews.length})</h2>

          <div className="space-y-4">
            {userReviews.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Uživatel zatím nemá žádná hodnocení.</p>
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
      </Tabs>
    </div>
  )
}

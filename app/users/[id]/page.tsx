"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Shield, Package, MapPin, Mail, Phone } from "lucide-react"
import type { User, Item, Review } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import ItemGrid from "@/components/items/item-grid"
import RatingDisplay from "@/components/ui/rating-display"

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser } = useAuth()
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
        const userData = await db.getUserById(params.id)
        if (!userData) {
          setError("Uživatel nebyl nalezen")
          return
        }

        // Načtení předmětů a recenzí
        const [items, reviews] = await Promise.all([db.getItemsByOwner(userData.id), db.getReviewsByUser(userData.id)])

        setUser(userData)
        setUserItems(items.filter((item) => item.is_available))
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

  // Pokud se jedná o vlastní profil, přesměrujeme na /profile
  useEffect(() => {
    if (currentUser && user && currentUser.id === user.id) {
      router.push("/profile")
    }
  }, [currentUser, user, router])

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
            <Button onClick={() => router.back()}>Zpět</Button>
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

              {/* Kontaktní informace podle nastavení soukromí */}
              <div className="space-y-2 mb-3">
                {privacySettings.show_email && (
                  <p className="text-gray-600">
                    <span className="inline-flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {user.email}
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
              </div>
            </div>

            <Button variant="outline" onClick={() => router.back()}>
              Zpět
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Předměty</TabsTrigger>
          <TabsTrigger value="reviews">Hodnocení</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <h2 className="text-2xl font-semibold">Předměty k půjčení ({userItems.length})</h2>

          {userItems.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tento uživatel nemá žádné předměty k půjčení.</p>
              </CardContent>
            </Card>
          ) : (
            <ItemGrid items={userItems} />
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <h2 className="text-2xl font-semibold">Hodnocení ({userReviews.length})</h2>

          <div className="space-y-4">
            {userReviews.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Tento uživatel zatím nemá žádná hodnocení.</p>
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

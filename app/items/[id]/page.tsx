"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Shield, CalendarIcon, MessageSquare } from "lucide-react"
import type { Item, Booking } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import RatingDisplay from "@/components/ui/rating-display"
import BookingCalendar from "@/components/calendar/booking-calendar"
import DatabaseError from "@/components/error/database-error"

const conditionLabels = {
  excellent: "Výborný",
  very_good: "Velmi dobrý",
  good: "Dobrý",
  fair: "Uspokojivý",
  poor: "Špatný",
}

const conditionColors = {
  excellent: "bg-green-100 text-green-800",
  very_good: "bg-blue-100 text-blue-800",
  good: "bg-yellow-100 text-yellow-800",
  fair: "bg-orange-100 text-orange-800",
  poor: "bg-red-100 text-red-800",
}

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [success, setSuccess] = useState("")

  const loadItem = async () => {
    try {
      setLoading(true)
      setError("")
      setIsNetworkError(false)
      const data = await db.getItemById(params.id as string)
      setItem(data)
    } catch (error: any) {
      console.error("Error loading item:", error)

      // Kontrola, zda jde o síťovou chybu (Supabase nedostupný)
      const isNetworkErr =
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network request failed")

      setIsNetworkError(isNetworkErr)
      setError(isNetworkErr ? "Nepodařilo se připojit k databázi" : "Chyba při načítání předmětu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItem()
  }, [params.id])

  const calculateTotalAmount = () => {
    if (!selectedDates.from || !selectedDates.to || !item) return 0

    const days = Math.ceil((selectedDates.to.getTime() - selectedDates.from.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return days * item.daily_rate
  }

  const handleBooking = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!selectedDates.from || !selectedDates.to) {
      setError("Vyberte prosím datum začátku a konce půjčení")
      return
    }

    if (!item) return

    setBookingLoading(true)
    setError("")

    try {
      const bookingData: Omit<Booking, "id" | "created_at" | "updated_at"> = {
        item_id: item.id,
        borrower_id: user.id,
        start_date: selectedDates.from.toISOString().split("T")[0],
        end_date: selectedDates.to.toISOString().split("T")[0],
        status: "pending",
        total_amount: calculateTotalAmount(),
        message: message.trim() || undefined,
      }

      await db.createBooking(bookingData)

      // Vytvoření notifikace pro majitele
      await db.createNotification({
        user_id: item.owner_id,
        title: "Nová žádost o půjčení",
        message: `${user.name} má zájem o půjčení předmětu "${item.title}"`,
        type: "booking_request",
        is_read: false,
      })

      setSuccess("Žádost o půjčení byla odeslána! Majitel vás bude kontaktovat.")
      setSelectedDates({ from: undefined, to: undefined })
      setMessage("")
    } catch (error: any) {
      console.error("Error creating booking:", error)

      // Kontrola, zda jde o síťovou chybu
      if (error.message?.includes("NetworkError") || error.message?.includes("Failed to fetch")) {
        setError("Došlo k chybě při připojení k databázi. Zkuste to prosím za chvíli.")
      } else {
        setError("Došlo k chybě při odesílání žádosti")
      }
    } finally {
      setBookingLoading(false)
    }
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

  if (isNetworkError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DatabaseError onRetry={loadItem} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Předmět nenalezen</h1>
          <Button onClick={() => router.push("/")}>Zpět na hlavní stránku</Button>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === item.owner_id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Levý sloupec - Obrázky a základní info */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
              <Image
                src={item.images[0] || "/placeholder.svg?height=400&width=600"}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>

            {item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="relative aspect-square rounded overflow-hidden">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${item.title} - obrázek ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                <Badge className={conditionColors[item.condition]}>{conditionLabels[item.condition]}</Badge>
              </div>

              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                {item.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {item.location}
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Přidáno {new Date(item.created_at).toLocaleDateString("cs-CZ")}
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed">{item.description}</p>
            </div>

            <Separator />

            {/* Informace o majiteli */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Majitel</h3>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.owner?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{item.owner?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-lg">{item.owner?.name}</h4>
                  <div className="flex items-center space-x-2">
                    <RatingDisplay rating={item.owner?.reputation_score || 0} reviewCount={0} size="sm" />
                    {item.owner?.is_verified && (
                      <div className="flex items-center text-green-600">
                        <Shield className="h-4 w-4 mr-1" />
                        <span className="text-sm">Ověřený</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pravý sloupec - Rezervace */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Rezervace</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{item.daily_rate} Kč</div>
                  <div className="text-sm text-gray-500">za den</div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {!item.is_available && (
                <Alert>
                  <AlertDescription>Tento předmět momentálně není dostupný pro půjčení.</AlertDescription>
                </Alert>
              )}

              {isOwner && (
                <Alert>
                  <AlertDescription>Toto je váš předmět. Nemůžete si ho půjčit sami od sebe.</AlertDescription>
                </Alert>
              )}

              {!user && (
                <Alert>
                  <AlertDescription>Pro rezervaci se musíte nejprve přihlásit.</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {item.is_available && !isOwner && user && (
                <>
                  <div>
                    <div className="mt-2">
                      <BookingCalendar itemId={item.id} selectedDates={selectedDates} onSelect={setSelectedDates} />
                    </div>
                  </div>

                  {selectedDates.from && selectedDates.to && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span>Doba půjčení:</span>
                        <span className="font-medium">
                          {Math.ceil(
                            (selectedDates.to.getTime() - selectedDates.from.getTime()) / (1000 * 60 * 60 * 24),
                          ) + 1}{" "}
                          dní
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Cena za den:</span>
                        <span>{item.daily_rate} Kč</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Celkem:</span>
                        <span>{calculateTotalAmount()} Kč</span>
                      </div>
                      {item.deposit_amount > 0 && (
                        <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                          <span>Kauce:</span>
                          <span>{item.deposit_amount} Kč</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="message">Zpráva pro majitele (volitelné)</Label>
                    <Textarea
                      id="message"
                      placeholder="Napište zprávu majiteli..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleBooking}
                    disabled={!selectedDates.from || !selectedDates.to || bookingLoading}
                    className="w-full"
                    size="lg"
                  >
                    {bookingLoading ? (
                      "Odesílání žádosti..."
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Odeslat žádost o půjčení
                      </>
                    )}
                  </Button>
                </>
              )}

              {!user && (
                <div className="space-y-2">
                  <Button asChild className="w-full" size="lg">
                    <a href="/login">Přihlásit se</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/register">Registrovat se</a>
                  </Button>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Žádost o půjčení je nezávazná</p>
                <p>• Majitel vás bude kontaktovat</p>
                <p>• Platba probíhá přímo mezi uživateli</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

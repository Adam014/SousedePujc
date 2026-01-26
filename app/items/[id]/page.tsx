"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Shield, CalendarIcon, MessageSquare, Edit, Trash2, AlertTriangle, Star, Clock, CheckCircle, ShieldCheck, Tag, Truck, Percent } from 'lucide-react'
import type { Item, Booking } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import RatingDisplay from "@/components/ui/rating-display"
import BookingCalendar from "@/components/calendar/booking-calendar"
import DatabaseError from "@/components/error/database-error"
import ImageGallery from "@/components/items/image-gallery"
import Breadcrumb from "@/components/ui/breadcrumb"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

// Slevy pro delší rezervace
const DISCOUNTS = [
  { days: 7, percentage: 10, label: "Týden" },
  { days: 14, percentage: 15, label: "2 týdny" },
  { days: 30, percentage: 20, label: "Měsíc" },
]

// Pomocná funkce pro nalezení aplikovatelné slevy
const findApplicableDiscount = (days: number) => {
  // Seřadíme slevy od největší po nejmenší
  const sortedDiscounts = [...DISCOUNTS].sort((a, b) => b.days - a.days)

  // Najdeme první slevu, která je aplikovatelná
  return sortedDiscounts.find((discount) => days >= discount.days) || null
}

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  // Initialize with today as the start date
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return { from: today, to: undefined }
  })
  // Key to force calendar refresh after booking
  const [calendarKey, setCalendarKey] = useState(0)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [success, setSuccess] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

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

    // Základní cena
    const basePrice = days * item.daily_rate

    // Najdeme aplikovatelnou slevu
    const discount = findApplicableDiscount(days)

    // Vypočítáme finální cenu
    if (discount) {
      const discountAmount = (basePrice * discount.percentage) / 100
      return basePrice - discountAmount
    }

    return basePrice
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
      // Format dates in local timezone to avoid UTC shift issues
      const formatDateLocal = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const bookingData: Omit<Booking, "id" | "created_at" | "updated_at"> = {
        item_id: item.id,
        borrower_id: user.id,
        start_date: formatDateLocal(selectedDates.from),
        end_date: formatDateLocal(selectedDates.to),
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

      // Vytvoření chat roomu pro komunikaci - now returns just the ID
      const chatRoomId = await db.createChatRoom({
        item_id: item.id,
        owner_id: item.owner_id,
        borrower_id: user.id,
      })

      // Přidání první zprávy do chatu
      if (chatRoomId) {
        await db.sendChatMessage({
          room_id: chatRoomId,
          sender_id: user.id,
          message: `Zdravím, mám zájem o půjčení předmětu "${item.title}" od ${selectedDates.from.toLocaleDateString("cs-CZ")} do ${selectedDates.to.toLocaleDateString("cs-CZ")}.${message ? ` ${message}` : ""}`,
        })
      }

      setSuccess("Žádost o půjčení byla odeslána! Majitel vás bude kontaktovat.")
      // Reset to today and refresh calendar
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      setSelectedDates({ from: today, to: undefined })
      setMessage("")
      // Increment key to force calendar to reload booked dates
      setCalendarKey(prev => prev + 1)
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

  const handleDeleteItem = async () => {
    if (!user || !item) return

    try {
      setDeleting(true)
      await db.deleteItem(item.id)
      router.push("/profile?tab=items")
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("Došlo k chybě při mazání předmětu")
      setDeleting(false)
      setDeleteDialogOpen(false)
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

  // Výpočet celkové ceny a slevy
  const days =
    selectedDates.from && selectedDates.to
      ? Math.ceil((selectedDates.to.getTime() - selectedDates.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0

  const basePrice = days * item.daily_rate
  const discount = findApplicableDiscount(days)
  const discountAmount = discount ? (basePrice * discount.percentage) / 100 : 0
  const finalPrice = basePrice - discountAmount

  // Získání názvu kategorie jako string
  const categoryName = item.category?.name || "Nezařazeno"

  // Breadcrumb items
  const breadcrumbItems = [
    ...(item.category ? [{ label: item.category.name, href: `/?category=${item.category.id}` }] : []),
    { label: item.title },
  ]

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Breadcrumb navigation */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Levý sloupec - Obrázky a základní info */}
        <div className="lg:col-span-2">
          <div className="mb-4 sm:mb-6">
            <ImageGallery images={item.images} alt={item.title} />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{item.title}</h1>
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/items/${item.id}/edit`)} className="touch-target-sm">
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Upravit</span>
                        <span className="sm:hidden">Upravit</span>
                      </Button>
                      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="touch-target-sm">
                            <Trash2 className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Smazat</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                              Smazat předmět
                            </DialogTitle>
                          </DialogHeader>
                          <DialogDescription>
                            Opravdu chcete smazat předmět <strong>{item.title}</strong>? Tato akce je nevratná a smaže
                            všechny související rezervace.
                          </DialogDescription>
                          <DialogFooter className="flex space-x-2 justify-end">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                              Zrušit
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteItem} disabled={deleting}>
                              {deleting ? "Mazání..." : "Smazat předmět"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  <Badge className={conditionColors[item.condition]}>{conditionLabels[item.condition]}</Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-gray-600 mb-4">
                {item.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>Přidáno {new Date(item.created_at).toLocaleDateString("cs-CZ")}</span>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4 h-auto p-1">
                  <TabsTrigger value="details" className="text-xs sm:text-sm py-2">Detaily</TabsTrigger>
                  <TabsTrigger value="rules" className="text-xs sm:text-sm py-2">
                    <span className="hidden sm:inline">Podmínky půjčení</span>
                    <span className="sm:hidden">Podmínky</span>
                  </TabsTrigger>
                  <TabsTrigger value="owner" className="text-xs sm:text-sm py-2">
                    <span className="hidden sm:inline">O majiteli</span>
                    <span className="sm:hidden">Majitel</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 text-lg leading-relaxed">{item.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Tag className="h-5 w-5 mr-2 text-blue-600" />
                          Specifikace
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span className="text-gray-600">Kategorie:</span>
                            <span className="font-medium">{categoryName}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600">Stav:</span>
                            <Badge className={conditionColors[item.condition]}>{conditionLabels[item.condition]}</Badge>
                          </li>
                          {item.brand && (
                            <li className="flex justify-between">
                              <span className="text-gray-600">Značka:</span>
                              <span className="font-medium">{item.brand}</span>
                            </li>
                          )}
                          {item.model && (
                            <li className="flex justify-between">
                              <span className="text-gray-600">Model:</span>
                              <span className="font-medium">{item.model}</span>
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Percent className="h-5 w-5 mr-2 text-green-600" />
                          Slevy při delším pronájmu
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {DISCOUNTS.map((discount) => (
                            <li key={discount.days} className="flex justify-between items-center">
                              <span className="text-gray-600">
                                {discount.label} ({discount.days}+ dní):
                              </span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                -{discount.percentage}%
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="deposit">
                          <AccordionTrigger className="text-base font-medium">
                            <div className="flex items-center">
                              <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
                              Kauce
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-gray-700 mb-2">
                              Při zapůjčení předmětu je vyžadována vratná kauce ve výši {item.deposit_amount} Kč.
                            </p>
                            <p className="text-gray-700">
                              Kauce bude vrácena v plné výši při vrácení předmětu v původním stavu.
                            </p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="pickup">
                          <AccordionTrigger className="text-base font-medium">
                            <div className="flex items-center">
                              <Truck className="h-5 w-5 mr-2 text-blue-600" />
                              Vyzvednutí a vrácení
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-gray-700">
                              Předmět je k vyzvednutí na adrese: {item.location || "Dle domluvy s majitelem"}.
                            </p>
                            <p className="text-gray-700 mt-2">
                              Přesný čas vyzvednutí a vrácení bude domluven s majitelem po potvrzení rezervace.
                            </p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="payment">
                          <AccordionTrigger className="text-base font-medium">
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                              Platba a storno podmínky
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-gray-700 mb-2">
                              Platba probíhá při vyzvednutí předmětu v hotovosti nebo dle domluvy s majitelem.
                            </p>
                            <p className="text-gray-700 mb-2">Storno podmínky:</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700">
                              <li>Zrušení více než 48 hodin před začátkem rezervace - bez poplatku</li>
                              <li>Zrušení méně než 48 hodin před začátkem rezervace - 50% z celkové částky</li>
                              <li>Nedostavení se bez zrušení - 100% z celkové částky</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="damage">
                          <AccordionTrigger className="text-base font-medium">
                            <div className="flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
                              Poškození předmětu
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-gray-700 mb-2">
                              V případě poškození předmětu bude z kauce odečtena částka odpovídající opravě nebo
                              náhradě.
                            </p>
                            <p className="text-gray-700">
                              Při úplném zničení nebo ztrátě předmětu je vypůjčitel povinen uhradit plnou hodnotu
                              předmětu.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="owner">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Link
                          href={`/users/${item.owner_id}`}
                          className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
                        >
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={item.owner?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{item.owner?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-xl">{item.owner?.name}</h4>
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
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <div className="text-gray-500 text-sm">Člen od</div>
                          <div className="font-medium">
                            {new Date(item.owner?.created_at || Date.now()).toLocaleDateString("cs-CZ")}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <div className="text-gray-500 text-sm">Předmětů k půjčení</div>
                          <div className="font-medium">{item.owner?.item_count || 1}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="font-medium mb-2 flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          Hodnocení a recenze
                        </h5>
                        {item.owner?.reviews && item.owner.reviews.length > 0 ? (
                          <div className="space-y-3">
                            {item.owner.reviews.slice(0, 3).map((review, index) => (
                              <div key={index} className="border-b pb-3">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center">
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarImage src={review.reviewer_avatar || "/placeholder.svg"} />
                                      <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{review.reviewer_name}</span>
                                  </div>
                                  <RatingDisplay rating={review.rating} size="sm" />
                                </div>
                                <p className="text-sm text-gray-600">{review.comment}</p>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(review.created_at).toLocaleDateString("cs-CZ")}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">Zatím žádné recenze</p>
                        )}

                        <Button variant="outline" size="sm" className="mt-4" asChild>
                          <Link href={`/users/${item.owner_id}`}>Zobrazit profil majitele</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
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
                      <BookingCalendar
                        key={calendarKey}
                        itemId={item.id}
                        selectedDates={selectedDates}
                        onSelect={setSelectedDates}
                        dailyRate={item.daily_rate}
                        depositAmount={item.deposit_amount}
                      />
                    </div>
                  </div>

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
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Odesílání žádosti...
                      </div>
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
                <p className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Žádost o půjčení je nezávazná
                </p>
                <p className="flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Majitel vás bude kontaktovat
                </p>
                <p className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Platba probíhá přímo mezi uživateli
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

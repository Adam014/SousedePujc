"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, Loader2 } from "lucide-react"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import InteractiveMap from "@/components/map/interactive-map"
import DatabaseError from "@/components/error/database-error"

export default function MapPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState("")

  const loadItems = async () => {
    try {
      setLoading(true)
      setError("")
      setIsNetworkError(false)
      const data = await db.getItems()
      // Filter items that have location coordinates
      const itemsWithLocation = data.filter((item) => item.location_lat && item.location_lng)
      setItems(itemsWithLocation)
    } catch (error: any) {
      console.error("Error loading items:", error)

      const isNetworkErr =
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network request failed")

      setIsNetworkError(isNetworkErr)
      setError(isNetworkErr ? "Nepodařilo se připojit k databázi" : "Chyba při načítání předmětů")
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolokace není podporována ve vašem prohlížeči")
      return
    }

    setLocationLoading(true)
    setLocationError("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        let errorMessage = "Nepodařilo se získat vaši polohu"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Přístup k poloze byl zamítnut"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Poloha není dostupná"
            break
          case error.TIMEOUT:
            errorMessage = "Vypršel čas pro získání polohy"
            break
        }

        setLocationError(errorMessage)
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }

  useEffect(() => {
    loadItems()
  }, [])

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
        <DatabaseError onRetry={loadItems} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Mapa předmětů</h1>
        <p className="text-gray-600 mb-4">
          Objevte předměty k půjčení ve vašem okolí. Klikněte na značku pro zobrazení detailů.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button onClick={requestLocation} disabled={locationLoading} className="flex items-center">
            {locationLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            {locationLoading ? "Získávání polohy..." : "Najít moji polohu"}
          </Button>

          {userLocation && (
            <div className="flex items-center text-green-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">Poloha nalezena</span>
            </div>
          )}
        </div>

        {locationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <InteractiveMap
                    items={items}
                    userLocation={userLocation}
                    center={userLocation || { lat: 50.0755, lng: 14.4378 }} // Default to Prague
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Statistiky
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{items.length}</div>
                    <div className="text-sm text-gray-600">Předmětů na mapě</div>
                  </div>

                  {userLocation && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">Vaše poloha</div>
                      <div className="text-xs text-gray-500">
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Legenda</h4>
                    <div className="flex items-center text-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span>Dostupné předměty</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                      <span>Nedostupné předměty</span>
                    </div>
                    {userLocation && (
                      <div className="flex items-center text-sm">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span>Vaše poloha</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

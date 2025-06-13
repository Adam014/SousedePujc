"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { Item } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Star } from "lucide-react"
import Link from "next/link"
import L from "leaflet"

// Funkce pro získání ikony podle kategorie
const getCategoryIcon = (categoryId: string) => {
  const iconMap: Record<string, string> = {
    "1": "/category-markers/tools.png",
    "2": "/category-markers/electronics.png",
    "3": "/category-markers/sports.png",
    "4": "/category-markers/garden.png",
    "5": "/category-markers/home.png",
  }

  return iconMap[categoryId] || "/category-markers/other.png"
}

interface ItemMapProps {
  items: Item[]
}

// Komponenta pro automatické určení polohy uživatele
function LocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const map = useMap()
  const userIcon = useMemo(() => {
    return L.icon({
      iconUrl: "/user-location-marker.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  }, [])

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition([e.latlng.lat, e.latlng.lng])
      map.flyTo(e.latlng, 13)
    })
  }, [map])

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div className="text-center">
          <strong>Vaše poloha</strong>
        </div>
      </Popup>
    </Marker>
  )
}

// Komponenta pro tlačítko "Najít moji polohu"
function LocateButton() {
  const map = useMap()

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 13 })
  }

  return (
    <div className="leaflet-bottom leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar">
        <Button onClick={handleLocate} className="bg-white text-black hover:bg-gray-100 shadow-md p-2" size="sm">
          <Navigation className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

// Funkce pro převod adresy na souřadnice s cachováním
const geocodeCache: Record<string, [number, number]> = {}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address) return null

  // Kontrola cache
  if (geocodeCache[address]) {
    return geocodeCache[address]
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
    )
    const data = await response.json()

    if (data && data.length > 0) {
      const coords: [number, number] = [Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon)]
      // Uložení do cache
      geocodeCache[address] = coords
      return coords
    }
    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

export default function ItemMap({ items }: ItemMapProps) {
  const [itemsWithCoords, setItemsWithCoords] = useState<(Item & { coords?: [number, number] })[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.0755, 14.4378]) // Praha jako výchozí
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<L.Map | null>(null)

  // Předpřipravené ikony pro kategorie
  const categoryIcons = useMemo(() => {
    const icons: Record<string, L.Icon> = {}

    // Předpřipravíme ikony pro všechny kategorie
    for (let i = 1; i <= 5; i++) {
      const categoryId = i.toString()
      icons[categoryId] = L.icon({
        iconUrl: getCategoryIcon(categoryId),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })
    }

    // Přidáme výchozí ikonu
    icons["default"] = L.icon({
      iconUrl: "/category-markers/other.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })

    return icons
  }, [])

  useEffect(() => {
    // Oprava problému s ikonami v Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    })

    const processItems = async () => {
      setIsLoading(true)

      // Paralelní zpracování všech položek pro rychlejší načítání
      const itemsWithCoordsPromises = items.map(async (item) => {
        if (item.location) {
          const coords = await geocodeAddress(item.location)
          return { ...item, coords }
        }
        return item
      })

      const processedItems = await Promise.all(itemsWithCoordsPromises)
      setItemsWithCoords(processedItems)

      // Najít první položku s platnými souřadnicemi pro centrování mapy
      const firstItemWithCoords = processedItems.find((item) => item.coords)
      if (firstItemWithCoords?.coords) {
        setMapCenter(firstItemWithCoords.coords)
      }

      setIsLoading(false)
    }

    processItems()
  }, [items])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {itemsWithCoords.map((item) =>
          item.coords ? (
            <Marker key={item.id} position={item.coords} icon={categoryIcons[item.category_id || "default"]}>
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center mb-3">
                    <div className="w-16 h-16 mr-3 overflow-hidden rounded">
                      <img
                        src={item.images?.[0] || "/placeholder.svg?height=64&width=64"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.daily_rate} Kč/den</p>
                      {item.owner && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 mr-1 text-yellow-500" />
                          {item.owner.reputation_score.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.location && (
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.location}
                    </div>
                  )}

                  <Link href={`/items/${item.id}`} passHref>
                    <Button size="sm" className="w-full mt-1">
                      Zobrazit detail
                    </Button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ) : null,
        )}

        <LocationMarker />
        <LocateButton />
      </MapContainer>
    </div>
  )
}

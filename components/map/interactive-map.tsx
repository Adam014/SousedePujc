"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "@/components/map/leaflet-components"
import { L } from "@/components/map/leaflet-components"
import type { Item } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface InteractiveMapProps {
  items: Item[]
  userLocation?: { lat: number; lng: number } | null
  center: { lat: number; lng: number }
}

// Component to update map center when user location changes
function MapController({
  center,
  userLocation,
}: { center: { lat: number; lng: number }; userLocation?: { lat: number; lng: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13)
    }
  }, [map, userLocation])

  return null
}

// Custom icons for different item states
const createCustomIcon = (available: boolean) => {
  const color = available ? "#3B82F6" : "#9CA3AF" // blue for available, gray for unavailable

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    className: "custom-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })
}

// User location icon
const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #EF4444;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: 32px;
          height: 32px;
          border: 2px solid #EF4444;
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(0.8); opacity: 0.3; }
        }
      </style>
    `,
    className: "user-location-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

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

export default function InteractiveMap({ items, userLocation, center }: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={userLocation ? 13 : 11}
      style={{ height: "100%", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController center={center} userLocation={userLocation} />

      {/* User location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
          <Popup>
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-4 w-4 text-red-500 mr-1" />
                <span className="font-medium">Vaše poloha</span>
              </div>
              <div className="text-xs text-gray-500">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Item markers */}
      {items.map((item) => {
        if (!item.location_lat || !item.location_lng) return null

        return (
          <Marker
            key={item.id}
            position={[item.location_lat, item.location_lng]}
            icon={createCustomIcon(item.is_available)}
          >
            <Popup maxWidth={300} minWidth={250}>
              <div className="p-2">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Image
                      src={item.images?.[0] || "/placeholder.svg"}
                      alt={item.title}
                      width={80}
                      height={60}
                      className="rounded-md object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs ${conditionColors[item.condition]}`}>
                        {conditionLabels[item.condition]}
                      </Badge>
                      {!item.is_available && (
                        <Badge variant="secondary" className="text-xs">
                          Nedostupné
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm font-medium text-blue-600 mb-2">
                      {item.daily_rate === 0 ? "Zdarma" : `${item.daily_rate} Kč/den`}
                    </div>

                    {item.location && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <span>Majitel: {item.owner?.name || "Neznámý"}</span>
                    </div>

                    <Link href={`/items/${item.id}`}>
                      <Button size="sm" className="w-full text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Zobrazit detail
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

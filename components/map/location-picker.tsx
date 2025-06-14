"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, Loader2 } from "lucide-react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "@/components/map/leaflet-components"

interface LocationPickerProps {
  value?: { lat: number; lng: number; address: string }
  onChange: (location: { lat: number; lng: number; address: string }) => void
}

// Component to handle map clicks
function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Reverse geocoding function (simplified - in production use proper geocoding service)
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    )
    const data = await response.json()

    if (data.display_name) {
      return data.display_name
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  )
  const [address, setAddress] = useState(value?.address || "")
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setLoading(true)

    try {
      const geocodedAddress = await reverseGeocode(lat, lng)
      setAddress(geocodedAddress)
      onChange({ lat, lng, address: geocodedAddress })
    } catch (error) {
      console.error("Error getting address:", error)
      const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setAddress(fallbackAddress)
      onChange({ lat, lng, address: fallbackAddress })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolokace není podporována ve vašem prohlížeči")
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSelect(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert("Nepodařilo se získat vaši polohu")
        setLoading(false)
      },
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location-address">Adresa</Label>
        <Input
          id="location-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Zadejte adresu nebo vyberte na mapě"
          className="mt-1"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setShowMap(!showMap)} className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          {showMap ? "Skrýt mapu" : "Vybrat na mapě"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
          Moje poloha
        </Button>
      </div>

      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vyberte polohu na mapě</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded-lg overflow-hidden">
              <MapContainer
                center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [50.0755, 14.4378]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationSelector onLocationSelect={handleLocationSelect} />

                {selectedLocation && <Marker position={[selectedLocation.lat, selectedLocation.lng]} />}
              </MapContainer>
            </div>

            <p className="text-sm text-gray-500 mt-2">Klikněte na mapu pro výběr přesné polohy</p>

            {selectedLocation && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <strong>Vybraná poloha:</strong> {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

// Importujeme Leaflet CSS
import "leaflet/dist/leaflet.css"

// Importujeme Leaflet
import L from "leaflet"

// Importujeme React-Leaflet komponenty
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet"

// Oprava problému s ikonami v Leaflet
if (typeof window !== "undefined" && L.Icon.Default) {
  delete (L.Icon.Default.prototype as any)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Exportujeme všechny komponenty
export { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, L }

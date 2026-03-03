"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowRight, ImageOff } from "lucide-react"
import type { Item } from "@/lib/types"
import { CONDITION_LABELS_CZ, CONDITION_COLORS } from "@/lib/constants"
import RatingDisplay from "@/components/ui/rating-display"

interface ItemCardProps {
  item: Item
  priority?: boolean
}

function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <ImageOff className="h-10 w-10 text-gray-300 mb-2" />
      <span className="text-xs text-gray-400">Bez fotky</span>
    </div>
  )
}

export default function ItemCard({ item, priority = false }: ItemCardProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = !imgError && item.images && item.images.length > 0 && item.images[0] !== "/placeholder.svg"

  return (
    <Link href={`/items/${item.id}`} prefetch={true} className="block group">
      <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 card-hover bg-white border-0 shadow-soft h-full flex flex-col">
        <div className="relative aspect-video bg-gray-100">
          {hasImage ? (
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              className={`object-cover${priority ? "" : " transition-opacity duration-200"}`}
              sizes="(max-width: 640px) calc(100vw - 24px), (max-width: 1024px) calc(50vw - 40px), (max-width: 1280px) 33vw, 25vw"
              fetchPriority={priority ? "high" : "auto"}
              decoding={priority ? "sync" : "async"}
              loading={priority ? "eager" : "lazy"}
              quality={75}
              onError={() => setImgError(true)}
            />
          ) : (
            <ImagePlaceholder />
          )}
          {!item.is_available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="secondary" className="text-white bg-red-600">
                Nedostupné
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
            {item.title}
          </h3>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description || ""}</p>

          <div className="flex items-center justify-between mb-3">
            <Badge className={CONDITION_COLORS[item.condition]}>{CONDITION_LABELS_CZ[item.condition]}</Badge>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {item.daily_rate === 0 ? "Zdarma" : `${item.daily_rate} Kč/den`}
            </span>
          </div>

          {item.location && (
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {item.location}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <div className="relative h-6 w-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={item.owner?.avatar_url || "/placeholder.svg"}
                  alt={item.owner?.name || "Uživatel"}
                  width={24}
                  height={24}
                  className="object-cover h-full w-full"
                  loading="lazy"
                />
              </div>
              <span className="text-sm text-gray-600">{item.owner?.name || "Neznámý"}</span>
            </div>

            {item.owner && (
              <RatingDisplay rating={item.owner.reputation_score || 0} reviewCount={0} showText={false} size="sm" />
            )}
          </div>

          <div className="w-full bg-blue-600 group-hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-md text-center transition-colors flex items-center justify-center gap-2">
            Zobrazit detail
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

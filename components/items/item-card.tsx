import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin } from "lucide-react"
import type { Item } from "@/lib/types"
import RatingDisplay from "@/components/ui/rating-display"

interface ItemCardProps {
  item: Item
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

export default function ItemCard({ item }: ItemCardProps) {
  // Handle potential null/undefined values from Supabase
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : "/placeholder.svg"

  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 card-hover bg-white border-0 shadow-soft">
      <Link href={`/items/${item.id}`} prefetch={true}>
        <div className="relative aspect-video bg-gray-100">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={item.title}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="eager"
            quality={75}
          />
          {!item.is_available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="secondary" className="text-white bg-red-600">
                Nedostupné
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/items/${item.id}`} prefetch={true}>
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors line-clamp-1">
            {item.title}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description || ""}</p>

        <div className="flex items-center justify-between mb-3">
          <Badge className={conditionColors[item.condition]}>{conditionLabels[item.condition]}</Badge>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {item.daily_rate === 0 ? "Zdarma" : `${item.daily_rate} Kč/den`}
          </span>
        </div>

        {item.location && (
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {item.location}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={item.owner?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">{item.owner?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{item.owner?.name || "Neznámý"}</span>
          </div>

          {item.owner && (
            <RatingDisplay rating={item.owner.reputation_score || 0} reviewCount={0} showText={false} size="sm" />
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

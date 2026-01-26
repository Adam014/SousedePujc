"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SlidersHorizontal, ArrowUpDown, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type SortOption = {
  value: string
  label: string
}

export type FilterValues = {
  priceRange: [number, number]
  distance?: number
  availability?: string
}

export type SortValue = string

interface ItemFiltersProps {
  onFilterChange: (filters: FilterValues) => void
  onSortChange: (sort: SortValue) => void
  minPrice: number
  maxPrice: number
  activeFilters: FilterValues
  activeSort: SortValue
}

const sortOptions: SortOption[] = [
  { value: "newest", label: "Nejnovější" },
  { value: "oldest", label: "Nejstarší" },
  { value: "price_asc", label: "Cena: od nejnižší" },
  { value: "price_desc", label: "Cena: od nejvyšší" },
  { value: "name_asc", label: "Název: A-Z" },
  { value: "name_desc", label: "Název: Z-A" },
]

const availabilityOptions = [
  { value: "all", label: "Všechny" },
  { value: "available", label: "Dostupné" },
  { value: "unavailable", label: "Nedostupné" },
]

export default function ItemFilters({
  onFilterChange,
  onSortChange,
  minPrice,
  maxPrice,
  activeFilters,
  activeSort,
}: ItemFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterValues>(activeFilters)
  const [priceRange, setPriceRange] = useState<[number, number]>(activeFilters.priceRange)

  const handleFilterApply = () => {
    onFilterChange({
      ...localFilters,
      priceRange,
    })
    setIsFilterOpen(false)
  }

  const handleFilterReset = () => {
    const resetFilters = {
      priceRange: [minPrice, maxPrice],
      distance: undefined,
      availability: "all",
    }
    setLocalFilters(resetFilters)
    setPriceRange([minPrice, maxPrice])
    onFilterChange(resetFilters)
    setIsFilterOpen(false)
  }

  const handleSortChange = (value: string) => {
    onSortChange(value)
  }

  // Memoize active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (activeFilters.priceRange[0] > minPrice || activeFilters.priceRange[1] < maxPrice) count++
    if (activeFilters.distance) count++
    if (activeFilters.availability && activeFilters.availability !== "all") count++
    return count
  }, [activeFilters, minPrice, maxPrice])

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-6">
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtry</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-80">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtry</h4>
              <Button variant="ghost" size="sm" onClick={handleFilterReset} className="h-8 px-2 text-xs">
                <X className="h-3.5 w-3.5 mr-1" />
                Resetovat
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price-range">Cenové rozpětí</Label>
              <div className="pt-4">
                <Slider
                  id="price-range"
                  min={minPrice}
                  max={maxPrice}
                  step={10}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="mb-4"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">{priceRange[0]} Kč</span>
                  <span className="text-sm">{priceRange[1]} Kč</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Vzdálenost</Label>
              <Select
                value={localFilters.distance?.toString() || "0"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    distance: value ? Number.parseInt(value) : undefined,
                  })
                }
              >
                <SelectTrigger id="distance">
                  <SelectValue placeholder="Vyberte vzdálenost" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Všechny vzdálenosti</SelectItem>
                  <SelectItem value="5">Do 5 km</SelectItem>
                  <SelectItem value="10">Do 10 km</SelectItem>
                  <SelectItem value="25">Do 25 km</SelectItem>
                  <SelectItem value="50">Do 50 km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Dostupnost</Label>
              <Select
                value={localFilters.availability || "all"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    availability: value,
                  })
                }
              >
                <SelectTrigger id="availability">
                  <SelectValue placeholder="Vyberte dostupnost" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleFilterApply}>
              Použít filtry
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Select value={activeSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <SelectValue placeholder="Seřadit podle" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {activeSort === option.value && <Check className="h-4 w-4 ml-2" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

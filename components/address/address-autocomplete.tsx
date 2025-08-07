"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const mockAddresses = [
  "Praha 1, Václavské náměstí 1",
  "Praha 1, Národní třída 15",
  "Praha 1, Wenceslas Square 25",
  "Praha 2, Vinohrady, Anglická 20",
  "Praha 2, Náměstí Míru 8",
  "Praha 3, Žižkov, Seifertova 45",
  "Praha 4, Nusle, 5. května 12",
  "Praha 5, Smíchov, Anděl 3",
  "Praha 6, Dejvice, Vítězné náměstí 11",
  "Praha 7, Holešovice, Dukelských hrdinů 25",
  "Brno, Masarykova 15",
  "Brno, Česká 20",
  "Brno, náměstí Svobody 8",
  "Ostrava, Nová Karolina 5",
  "Plzeň, náměstí Republiky 1",
  "České Budějovice, Přemysl Otakar II. 2",
]

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Zadejte adresu...",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)

    // Simulace API volání s malým zpožděním
    const timer = setTimeout(() => {
      const filtered = mockAddresses
        .filter((address) => address.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)

      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
  }

  const handleInputBlur = () => {
    // Zpožděné skrytí aby stihli kliknout na návrh
    setTimeout(() => setShowSuggestions(false), 200)
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="pl-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

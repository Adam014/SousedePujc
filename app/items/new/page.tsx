"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, ArrowLeft } from "lucide-react"
import type { Category } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import AddressAutocomplete from "@/components/address/address-autocomplete"

const conditionOptions = [
  { value: "excellent", label: "Výborný" },
  { value: "very_good", label: "Velmi dobrý" },
  { value: "good", label: "Dobrý" },
  { value: "fair", label: "Uspokojivý" },
  { value: "poor", label: "Špatný" },
]

export default function NewItemPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isFree, setIsFree] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    condition: "good",
    daily_rate: "",
    deposit_amount: "",
    location: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      const loadCategories = async () => {
        try {
          const data = await db.getCategories()
          setCategories(data)
        } catch (error) {
          console.error("Error loading categories:", error)
          setError("Chyba při načítání kategorií")
        }
      }
      loadCategories()
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!user) {
      setError("Musíte být přihlášeni")
      setLoading(false)
      return
    }

    // Validace
    if (!formData.title.trim()) {
      setError("Název předmětu je povinný")
      setLoading(false)
      return
    }

    if (!formData.category_id) {
      setError("Vyberte kategorii")
      setLoading(false)
      return
    }

    try {
      const itemData = {
        owner_id: user.id,
        category_id: formData.category_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        condition: formData.condition as "excellent" | "very_good" | "good" | "fair" | "poor",
        daily_rate: isFree ? 0 : Number.parseFloat(formData.daily_rate) || 0,
        deposit_amount: Number.parseFloat(formData.deposit_amount) || 0,
        is_available: true,
        location: formData.location.trim(),
        images: ["/placeholder.svg?height=300&width=400"],
      }

      await db.createItem(itemData)
      setSuccess("Předmět byl úspěšně vytvořen!")

      // Přesměrování po 2 sekundách
      setTimeout(() => {
        router.push("/profile?tab=items")
      }, 2000)
    } catch (error) {
      console.error("Error creating item:", error)
      setError("Došlo k chybě při vytváření předmětu. Zkuste to prosím znovu.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFreeChange = (checked: boolean) => {
    setIsFree(checked)
    if (checked) {
      setFormData((prev) => ({ ...prev, daily_rate: "0" }))
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zpět
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Přidat nový předmět</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="title">Název předmětu *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Např. Aku vrtačka Bosch"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Popis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Popište váš předmět, jeho stav, příslušenství..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange("category_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kategorii" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Stav *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleInputChange("condition", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_free"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={isFree}
                  onChange={(e) => handleFreeChange(e.target.checked)}
                />
                <Label htmlFor="is_free">Nabídnout zdarma</Label>
              </div>

              {!isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Cena za den (Kč)</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => handleInputChange("daily_rate", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit_amount">Kauce (Kč)</Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deposit_amount}
                      onChange={(e) => handleInputChange("deposit_amount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokalita</Label>
              <AddressAutocomplete
                value={formData.location}
                onChange={(value) => handleInputChange("location", value)}
                placeholder="Začněte psát adresu..."
              />
            </div>

            <div className="space-y-2">
              <Label>Fotografie</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Přetáhněte fotografie sem nebo klikněte pro výběr</p>
                <p className="text-sm text-gray-500">Podporované formáty: JPG, PNG, GIF (max. 5MB)</p>
                <Button type="button" variant="outline" className="mt-4">
                  Vybrat soubory
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Tipy pro úspěšné půjčování:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Přidejte kvalitní fotografie ze všech stran</li>
                <li>• Popište stav předmětu co nejpřesněji</li>
                <li>• Uveďte všechno příslušenství, které je součástí půjčení</li>
                <li>• Stanovte reálnou cenu a kauci</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Zrušit
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Vytváření..." : "Vytvořit předmět"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import type { Category, Item } from "@/lib/types"
import { db } from "@/lib/database"
import { useAuth } from "@/lib/auth"
import AddressAutocomplete from "@/components/address/address-autocomplete"
import ImageUpload from "@/components/items/image-upload"
import DatabaseError from "@/components/error/database-error"

const conditionOptions = [
  { value: "excellent", label: "Výborný" },
  { value: "very_good", label: "Velmi dobrý" },
  { value: "good", label: "Dobrý" },
  { value: "fair", label: "Uspokojivý" },
  { value: "poor", label: "Špatný" },
]

export default function EditItemPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [isFree, setIsFree] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    condition: "good",
    daily_rate: "",
    deposit_amount: "",
    location: "",
    is_available: true,
  })

  // Načtení předmětu a kategorií
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError("")
        setIsNetworkError(false)

        // Načtení předmětu
        const itemData = await db.getItemById(params.id as string)
        if (!itemData) {
          setError("Předmět nebyl nalezen")
          setLoading(false)
          return
        }

        // Kontrola, zda je uživatel vlastníkem předmětu
        if (user && itemData.owner_id !== user.id) {
          router.push(`/items/${params.id}`)
          return
        }

        setItem(itemData)
        setImages(itemData.images || [])
        setIsFree(itemData.daily_rate === 0)
        setFormData({
          title: itemData.title || "",
          description: itemData.description || "",
          category_id: itemData.category_id || "",
          condition: itemData.condition || "good",
          daily_rate: itemData.daily_rate?.toString() || "0",
          deposit_amount: itemData.deposit_amount?.toString() || "0",
          location: itemData.location || "",
          is_available: itemData.is_available,
        })

        // Načtení kategorií
        const categoriesData = await db.getCategories()
        setCategories(categoriesData)
      } catch (error: any) {
        console.error("Error loading data:", error)

        // Kontrola, zda jde o síťovou chybu
        const isNetworkErr =
          error.message?.includes("NetworkError") ||
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("Network request failed")

        setIsNetworkError(isNetworkErr)
        setError(isNetworkErr ? "Nepodařilo se připojit k databázi" : "Chyba při načítání dat")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, authLoading, params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    if (!user || !item) {
      setError("Došlo k chybě, zkuste to prosím znovu")
      setSaving(false)
      return
    }

    // Validace
    if (!formData.title.trim()) {
      setError("Název předmětu je povinný")
      setSaving(false)
      return
    }

    if (!formData.category_id) {
      setError("Vyberte kategorii")
      setSaving(false)
      return
    }

    try {
      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        condition: formData.condition as "excellent" | "very_good" | "good" | "fair" | "poor",
        daily_rate: isFree ? 0 : Number.parseFloat(formData.daily_rate) || 0,
        deposit_amount: Number.parseFloat(formData.deposit_amount) || 0,
        is_available: formData.is_available,
        location: formData.location.trim(),
        images: images.length > 0 ? images : ["/placeholder.svg?height=300&width=400"],
      }

      await db.updateItem(item.id, itemData)
      setSuccess("Předmět byl úspěšně aktualizován!")

      // Přesměrování po 2 sekundách
      setTimeout(() => {
        router.push(`/items/${item.id}`)
      }, 2000)
    } catch (error) {
      console.error("Error updating item:", error)
      setError("Došlo k chybě při aktualizaci předmětu. Zkuste to prosím znovu.")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFreeChange = (checked: boolean) => {
    setIsFree(checked)
    if (checked) {
      setFormData((prev) => ({ ...prev, daily_rate: "0" }))
    }
  }

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages)
  }

  const handleRetry = () => {
    router.refresh()
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (isNetworkError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DatabaseError onRetry={handleRetry} />
      </div>
    )
  }

  if (!user || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Předmět nenalezen</h1>
          <Button onClick={() => router.push("/")}>Zpět na hlavní stránku</Button>
        </div>
      </div>
    )
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
          <CardTitle className="text-2xl">Upravit předmět</CardTitle>
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
              <ImageUpload maxImages={3} onImagesChange={handleImagesChange} initialImages={images} />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="is_available"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.is_available}
                onChange={(e) => handleInputChange("is_available", e.target.checked)}
              />
              <Label htmlFor="is_available">Předmět je dostupný k zapůjčení</Label>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Zrušit
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Ukládání..." : "Uložit změny"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

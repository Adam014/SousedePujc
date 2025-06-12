"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth"
import AddressAutocomplete from "@/components/address/address-autocomplete"
import AvatarUpload from "@/components/profile/avatar-upload"

export default function EditProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      bio: user.bio || "",
    })

    setAvatarUrl(user.avatar_url || null)
  }, [user, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Simulace aktualizace profilu
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // V produkci by se zde aktualizoval uživatel v databázi
      setSuccess("Profil byl úspěšně aktualizován!")

      setTimeout(() => {
        router.push("/profile")
      }, 2000)
    } catch (error) {
      setError("Došlo k chybě při aktualizaci profilu")
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold">Upravit profil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Osobní údaje</CardTitle>
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

            {/* Avatar */}
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={avatarUrl}
              userName={formData.name}
              onAvatarUpdate={setAvatarUrl}
            />

            {/* Základní údaje */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Jméno a příjmení *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+420 123 456 789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(value) => handleInputChange("address", value)}
                placeholder="Vaše adresa..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">O mně</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Napište něco o sobě..."
                rows={4}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Tipy pro lepší profil:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Přidejte si profilovou fotografii pro větší důvěryhodnost</li>
                <li>• Vyplňte telefonní číslo pro snadnější komunikaci</li>
                <li>• Popište se v sekci "O mně" - pomůže to při výběru</li>
                <li>• Přesná adresa usnadní koordinaci předání předmětů</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Zrušit
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  "Ukládání..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Uložit změny
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import type { User } from "@/lib/types"

interface PrivacySettingsProps {
  user: User
  onChange: (settings: User["privacy_settings"]) => void
}

export default function PrivacySettings({ user, onChange }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<User["privacy_settings"]>(
    user.privacy_settings || {
      show_email: false,
      show_phone: false,
      show_address: false,
      show_bio: true,
    },
  )

  const handleChange = (key: keyof User["privacy_settings"], value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onChange(newSettings)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Nastavení soukromí
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Vyberte, které informace budou viditelné pro ostatní uživatele na vašem veřejném profilu.
          </p>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_email">E-mail</Label>
              <p className="text-sm text-gray-500">Zobrazit váš e-mail ostatním uživatelům</p>
            </div>
            <Switch
              id="show_email"
              checked={settings.show_email}
              onCheckedChange={(checked) => handleChange("show_email", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_phone">Telefon</Label>
              <p className="text-sm text-gray-500">Zobrazit vaše telefonní číslo ostatním uživatelům</p>
            </div>
            <Switch
              id="show_phone"
              checked={settings.show_phone}
              onCheckedChange={(checked) => handleChange("show_phone", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_address">Adresa</Label>
              <p className="text-sm text-gray-500">Zobrazit vaši adresu ostatním uživatelům</p>
            </div>
            <Switch
              id="show_address"
              checked={settings.show_address}
              onCheckedChange={(checked) => handleChange("show_address", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_bio">O mně</Label>
              <p className="text-sm text-gray-500">Zobrazit informace o vás ostatním uživatelům</p>
            </div>
            <Switch
              id="show_bio"
              checked={settings.show_bio}
              onCheckedChange={(checked) => handleChange("show_bio", checked)}
            />
          </div>

          <div className="mt-6 p-3 bg-yellow-50 rounded-md">
            <div className="flex items-start">
              <EyeOff className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Poznámka k soukromí:</strong> Vaše jméno a profilová fotka budou vždy veřejně viditelné.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Při rezervaci předmětu budou vaše kontaktní údaje sdíleny s vlastníkem předmětu bez ohledu na toto
                  nastavení.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

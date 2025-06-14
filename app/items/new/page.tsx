"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import type { Item } from "@/types"
import { createItem } from "@/actions/item"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { UploadDropzone } from "@/components/upload-dropzone"
import { deleteFile } from "@/lib/s3"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageIcon } from "@radix-ui/react-icons"
import { Progress } from "@/components/ui/progress"
import LocationPicker from "@/components/map/location-picker"

const CreateItemFormSchema = z.object({
  title: z.string().min(2, {
    message: "Název musí mít alespoň 2 znaky.",
  }),
  description: z.string().min(10, {
    message: "Popis musí mít alespoň 10 znaků.",
  }),
  categoryId: z.string().min(1, {
    message: "Vyberte kategorii.",
  }),
  condition: z.string().min(1, {
    message: "Vyberte stav.",
  }),
  dailyRate: z.coerce.number().min(1, {
    message: "Cena musí být alespoň 1 Kč.",
  }),
  depositAmount: z.coerce.number().min(0, {
    message: "Záloha musí být alespoň 0 Kč.",
  }),
  location: z.string().min(2, {
    message: "Zadejte lokalitu.",
  }),
})

interface CreateItemFormValues extends z.infer<typeof CreateItemFormSchema> {}

const conditions = [
  {
    label: "Nové",
    value: "new",
  },
  {
    label: "Použité",
    value: "used",
  },
  {
    label: "Poškozené",
    value: "damaged",
  },
]

function generateRandomId() {
  return uuidv4()
}

const ItemForm = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [categoryId, setCategoryId] = useState<string>("")
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)

  const user = session?.user

  const form = useForm<CreateItemFormValues>({
    resolver: zodResolver(CreateItemFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      condition: "",
      dailyRate: 1,
      depositAmount: 0,
      location: "",
    },
  })

  async function onSubmit(data: CreateItemFormValues) {
    setIsSubmitting(true)
    if (!user) {
      toast.error("Musíte být přihlášený.")
      return
    }

    if (uploadedImages.length === 0) {
      toast.error("Nahrajte alespoň jednu fotku.")
      return
    }

    try {
      toast.loading("Vytváříme inzerát...")

      const { title, description, condition, dailyRate, depositAmount } = data

      const itemData: Omit<Item, "id" | "created_at" | "updated_at"> = {
        owner_id: user.id,
        category_id: categoryId,
        title,
        description,
        condition: condition as Item["condition"],
        daily_rate: dailyRate,
        deposit_amount: depositAmount,
        is_available: true,
        location: location?.address || "",
        location_lat: location?.lat,
        location_lng: location?.lng,
        images: uploadedImages,
      }

      await createItem(itemData)

      toast.success("Inzerát byl úspěšně vytvořen.")
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Při vytváření inzerátu došlo k chybě. Zkuste to prosím znovu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-80" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-52" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-1 pl-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === "unauthenticated") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nemáte oprávnění k zobrazení této stránky.</CardTitle>
          <CardDescription>Přihlaste se pro pokračování.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="container relative">
      <Card>
        <CardHeader>
          <CardTitle>Nový inzerát</CardTitle>
          <CardDescription>Zde můžete vytvořit nový inzerát.</CardDescription>
        </CardHeader>
        <CardContent className="pl-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název</FormLabel>
                      <FormControl>
                        <Input placeholder="Název inzerátu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setCategoryId(value)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte kategorii" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="6545989944b8464196999999">Nářadí</SelectItem>
                          <SelectItem value="6545989d44b846419699999a">Stroje</SelectItem>
                          <SelectItem value="654598a144b846419699999b">Dílna</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Popis</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Podrobný popis inzerátu" className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>Napište podrobný popis inzerátu.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stav</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte stav" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {conditions.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dailyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena za den</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Cena za den" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Záloha</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Výše zálohy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokalita</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Město, ulice, atd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="location">Poloha na mapě</Label>
                <LocationPicker value={location} onChange={setLocation} />
              </div>
              <div>
                <Label>Fotky</Label>
                <UploadDropzone value={uploadedImages} onChange={setUploadedImages} setProgress={setProgress} />
                {progress > 0 && progress < 100 ? <Progress value={progress} className="mt-2" /> : null}
                {uploadedImages.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image} className="relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt="Uploaded"
                          className="h-32 w-full rounded-md object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute right-2 top-2 rounded-full opacity-75 hover:opacity-100"
                          onClick={async () => {
                            try {
                              await deleteFile(image)
                              setUploadedImages(uploadedImages.filter((img) => img !== image))
                              toast.success("Fotka byla smazána.")
                            } catch (error) {
                              toast.error("Chyba při mazání fotky.")
                            }
                          }}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Vytváříme inzerát..." : "Vytvořit inzerát"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ItemForm

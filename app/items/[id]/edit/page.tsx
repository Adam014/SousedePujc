"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Item } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import LocationPicker from "@/components/map/location-picker"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.number().min(0),
})

interface Props {
  params: {
    id: string
  }
}

const EditItemPage = ({ params }: Props) => {
  const [item, setItem] = useState<Item>()
  const router = useRouter()
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
    },
  })

  useEffect(() => {
    const loadItem = async () => {
      const res = await fetch(`/api/items/${params.id}`)
      const data = await res.json()
      setItem(data)
      form.reset({
        name: data.name,
        description: data.description,
        price: data.price,
      })
      if (data.location_lat && data.location_lng) {
        setLocation({
          lat: data.location_lat,
          lng: data.location_lng,
          address: data.location || "",
        })
      }
    }

    loadItem()
  }, [params.id, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await fetch(`/api/items/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...values,
        location_lat: location?.lat,
        location_lng: location?.lng,
        location: location?.address,
      }),
    })
    router.push("/")
  }

  if (!item) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-1/2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Item name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Item description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Item price"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LocationPicker location={location} setLocation={setLocation} />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  )
}

export default EditItemPage

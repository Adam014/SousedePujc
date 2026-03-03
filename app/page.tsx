import { Suspense } from "react"
import { preload } from "react-dom"
import { getImageProps } from "next/image"
import HomeClient from "./home-client"
import { db } from "@/lib/database"

export const revalidate = 30

export default async function HomePage() {
  let initialItems: Awaited<ReturnType<typeof db.getItems>> = []
  try {
    initialItems = await db.getItems()
  } catch (error) {
    console.error("Server fetch failed:", error)
  }

  // Preload the LCP image before Suspense boundary so it's in the initial HTML stream
  const lcpImageUrl = initialItems[0]?.images?.[0]
  if (lcpImageUrl) {
    const { props } = getImageProps({
      src: lcpImageUrl,
      alt: "",
      fill: true,
      sizes: "(max-width: 640px) calc(100vw - 24px), (max-width: 1024px) calc(50vw - 40px), (max-width: 1280px) 33vw, 25vw",
      quality: 75,
    })
    preload(props.src, {
      as: "image",
      imageSrcSet: props.srcSet,
      imageSizes: props.sizes,
      fetchPriority: "high",
    })
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <HomeClient initialItems={initialItems} />
    </Suspense>
  )
}

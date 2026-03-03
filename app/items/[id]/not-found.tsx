import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ItemNotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Předmět nenalezen</h1>
        <p className="text-gray-600 mb-6">Předmět, který hledáte, neexistuje nebo byl smazán.</p>
        <Button asChild>
          <Link href="/">Zpět na hlavní stránku</Link>
        </Button>
      </div>
    </div>
  )
}

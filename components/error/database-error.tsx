"use client"

import { ServerOffIcon as DatabaseOff, RefreshCcw } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface DatabaseErrorProps {
  onRetry: () => void
  message?: string
}

export default function DatabaseError({ onRetry, message }: DatabaseErrorProps) {
  return (
    <Alert variant="destructive" className="mb-6 max-w-3xl mx-auto">
      <div className="flex items-start">
        <DatabaseOff className="h-5 w-5 mr-2 mt-0.5" />
        <div>
          <AlertTitle className="text-lg font-semibold mb-2">Problém s připojením k databázi</AlertTitle>
          <AlertDescription>
            <div className="space-y-4">
              <p>
                {message ||
                  "Nepodařilo se připojit k databázovému serveru Supabase. Momentálně může být služba nedostupná nebo přetížená."}
              </p>
              <p>Děkujeme za trpělivost, zkuste to prosím za chvíli znovu.</p>
            </div>
          </AlertDescription>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Button onClick={onRetry} variant="destructive" className="flex items-center">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Zkusit znovu
        </Button>
      </div>
    </Alert>
  )
}

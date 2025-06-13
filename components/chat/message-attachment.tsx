"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Download, FileIcon, ExternalLink } from "lucide-react"

interface MessageAttachmentProps {
  url: string
  type: "image" | "file"
  fileName: string
  isCurrentUser: boolean
}

export default function MessageAttachment({ url, type, fileName, isCurrentUser }: MessageAttachmentProps) {
  const [imageError, setImageError] = useState(false)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (type === "image" && !imageError) {
    return (
      <div className="mt-2">
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative cursor-pointer group">
              <img
                src={url || "/placeholder.svg"}
                alt={fileName}
                className="max-w-xs max-h-48 rounded-lg object-cover"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <img src={url || "/placeholder.svg"} alt={fileName} className="w-full h-auto max-h-[80vh] object-contain" />
          </DialogContent>
        </Dialog>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs opacity-75">{fileName}</span>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-6 px-2">
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`mt-2 p-3 rounded-lg border ${
        isCurrentUser ? "bg-blue-400 border-blue-300" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center space-x-3">
        <FileIcon className={`h-8 w-8 ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrentUser ? "text-white" : "text-gray-900"}`}>{fileName}</p>
          <p className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}>Soubor</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className={`h-8 w-8 p-0 ${
            isCurrentUser ? "text-blue-100 hover:text-white hover:bg-blue-400" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

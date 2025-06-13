"use client"

import { Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface MessageAttachmentProps {
  fileUrl: string
  fileName: string
  fileType: string
}

export default function MessageAttachment({ fileUrl, fileName, fileType }: MessageAttachmentProps) {
  const isImage = fileType.startsWith("image/")

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isImage) {
    return (
      <div className="mt-2">
        <div className="relative max-w-xs">
          <Image
            src={fileUrl || "/placeholder.svg"}
            alt={fileName}
            width={300}
            height={200}
            className="rounded-lg object-cover cursor-pointer"
            onClick={() => window.open(fileUrl, "_blank")}
          />
        </div>
        <p className="text-xs mt-1 opacity-75">{fileName}</p>
      </div>
    )
  }

  return (
    <div className="mt-2 p-3 bg-white/10 rounded-lg border border-white/20">
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4" />
        <span className="text-sm flex-1 truncate">{fileName}</span>
        <Button variant="ghost" size="sm" onClick={handleDownload} className="h-6 w-6 p-0">
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

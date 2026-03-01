"use client"

import dynamic from "next/dynamic"

const ChatPopup = dynamic(() => import("@/components/chat/chat-popup"), {
  ssr: false,
})

export default function ChatPopupLazy() {
  return <ChatPopup />
}

"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto", className)}
    >
      <ol className="flex items-center gap-1 sm:gap-2 min-w-0">
        {/* Home link */}
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-blue-600 transition-colors p-1 -m-1 rounded touch-target-sm"
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Domů</span>
          </Link>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center min-w-0">
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mx-1" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-blue-600 transition-colors truncate max-w-[120px] sm:max-w-[200px] p-1 -m-1 rounded"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium truncate max-w-[150px] sm:max-w-[300px]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

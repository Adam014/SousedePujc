"use client"

import Link from "next/link"
import { useState } from "react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-gray-500 lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <span className="sr-only">Workflow</span>
              <img
                className="h-10 w-auto"
                src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=500"
                alt=""
              />
            </Link>
            <div className="hidden ml-10 space-x-8 lg:block">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/map"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Mapa
              </Link>
            </div>
          </div>
          <div className="ml-10 space-x-4">
            <Link
              href="/login"
              className="inline-block bg-indigo-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-indigo-700"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-block bg-white py-2 px-4 border border-gray-300 rounded-md text-base font-medium text-gray-500 hover:bg-gray-100"
            >
              Sign up
            </Link>
          </div>
        </div>
        <div className="lg:hidden">
          <button
            type="button"
            className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-expanded="false"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            {/* Heroicon name: outline/menu */}
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state. */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} lg:hidden`}>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="mt-3 space-y-1">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Contact
            </Link>
            <Link
              href="/map"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Mapa
            </Link>
            <Link
              href="/login"
              className="inline-block bg-indigo-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-indigo-700"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-block bg-white py-2 px-4 border border-gray-300 rounded-md text-base font-medium text-gray-500 hover:bg-gray-100"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

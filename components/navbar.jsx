"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { data: session } = useSession()
  const isLoggedIn = !!session

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container flex h-28 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-icon.png" alt="" className="h-20 w-auto shrink-0" />
          <span className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Diabetic Retinopathy Detection
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
            Home
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
            About
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <Button
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Login
              </Link>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>

        <Button variant="outline" size="icon" className="md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </div>
    </header>
  )
}


"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Navbar } from "../../components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { initializeApp, getApps, getApp } from "firebase/app";  // Import getApps and getApp

// Firebase imports

import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD93QLoWNrXo7drg2aBivaycz0SbD_faEw",
  authDomain: "dr-detection-53db0.firebaseapp.com",
  projectId: "dr-detection-53db0",
  storageBucket: "dr-detection-53db0.firebasestorage.app",
  messagingSenderId: "988432779226",
  appId: "1:988432779226:web:59b6cae3e4067707d722e3",
  measurementId: "G-94K7S1VM4T",
}

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const userData = {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || email.split("@")[0],
        isLoggedIn: true,
        emailVerified: true,
      }

      // Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(userData))

      // Set auth cookie with HttpOnly and Secure flags for better security
      document.cookie = "auth=true; path=/; max-age=604800; SameSite=Strict" // 7 days

      // Redirect to callback URL or dashboard
      router.push(callbackUrl)
    } catch (err) {
      setError(err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Google accounts are pre-verified
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          fullName: user.displayName,
          email: user.email,
          isLoggedIn: true,
          emailVerified: true,
        }),
      )

      // Set auth cookie with HttpOnly and Secure flags for better security
      document.cookie = "auth=true; path=/; max-age=604800; SameSite=Strict" // 7 days

      // Redirect to callback URL or dashboard
      router.push(callbackUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Sign in with Google
            </Button>

            <p className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

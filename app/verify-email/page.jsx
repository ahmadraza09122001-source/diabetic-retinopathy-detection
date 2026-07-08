"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Navbar } from "../../components/navbar"
import { getApps, getApp, initializeApp } from "firebase/app";
// Firebase imports

import { getAuth, applyActionCode, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth"

// Simple icon components
const MailIcon = () => (
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
    className="h-6 w-6 text-blue-600"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const InfoIcon = () => (
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
    className="h-4 w-4"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const CheckCircleIcon = () => (
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
    className="h-6 w-6 text-green-600"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

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

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [notification, setNotification] = useState(null)
  const [verificationMode, setVerificationMode] = useState("waiting") // waiting, manual, success

  // Check for action code in URL (when user clicks the verification link in email)
  useEffect(() => {
    const oobCode = searchParams.get("oobCode")
    const mode = searchParams.get("mode")

    if (oobCode && mode === "verifyEmail") {
      verifyEmail(oobCode)
    }
  }, [searchParams])

  // Get email from localStorage
  useEffect(() => {
    const pendingUser = localStorage.getItem("pendingUser")
    if (pendingUser) {
      try {
        const userData = JSON.parse(pendingUser)
        setEmail(userData.email || "")
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const verifyEmail = async (oobCode) => {
    setIsLoading(true)
    try {
      await applyActionCode(auth, oobCode)
      setIsVerified(true)
      setVerificationMode("success")

      // Update the user data in localStorage
      const pendingUser = localStorage.getItem("pendingUser")
      if (pendingUser) {
        const userData = JSON.parse(pendingUser)
        userData.emailVerified = true
        localStorage.setItem("pendingUser", JSON.stringify(userData))
      }

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      setError("Failed to verify email. The link may have expired or is invalid.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      // For resending, we need to sign in first
      if (password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(userCredential.user)
        setNotification("Verification email has been resent. Please check your inbox.")
        setError("")
        setPassword("")
      } else {
        setVerificationMode("manual")
        return
      }
    } catch (error) {
      setError("Failed to resend verification email. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualVerification = async (e) => {
    e.preventDefault()
    await handleResendVerification()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant="info" className="w-64">
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="bg-blue-100 p-3 rounded-full">
                <MailIcon />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {isVerified ? "Email Verified!" : "Verify your email"}
            </CardTitle>
            <CardDescription className="text-center">
              {isVerified
                ? "Your email has been verified successfully!"
                : `We've sent a verification link to ${email || "your email"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationMode === "success" ? (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircleIcon />
                  </div>
                </div>
                <p className="text-green-600 font-medium">Email verified successfully!</p>
                <p className="text-gray-600 mt-2">Redirecting you to the login page...</p>
              </div>
            ) : verificationMode === "manual" ? (
              <form onSubmit={handleManualVerification} className="space-y-4">
                <div className="space-y-2">
                  <Alert variant="info" className="mb-4">
                    <InfoIcon className="mr-2" />
                    <AlertDescription>Please enter your password to resend the verification email.</AlertDescription>
                  </Alert>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                    required
                  />

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <Alert variant="info" className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
                  <div className="flex items-start">
                    <InfoIcon className="mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Check your inbox</p>
                      <p className="text-sm mt-1">
                        We've sent a verification link to your email address. Please check your inbox and click the link
                        to verify your account.
                      </p>
                    </div>
                  </div>
                </Alert>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    Didn't receive the email? Check your spam folder or request a new verification link.
                  </p>
                  <Button onClick={handleResendVerification} variant="outline" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Back to Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

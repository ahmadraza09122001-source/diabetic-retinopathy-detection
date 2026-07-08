"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth, db, googleProvider, storage } from "@/lib/firebase" // ✅ keep this one only

export default function AuthCheck() {
  const [authStatus, setAuthStatus] = useState({
    checking: true,
    authenticated: false,
    user: null,
    error: null,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setAuthStatus({
            checking: false,
            authenticated: true,
            user: {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
            },
            error: null,
          })
        } else {
          setAuthStatus({
            checking: false,
            authenticated: false,
            user: null,
            error: null,
          })
        }
      },
      (error) => {
        setAuthStatus({
          checking: false,
          authenticated: false,
          user: null,
          error: error.message,
        })
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    try {
      const userInfo = localStorage.getItem("user")
      if (userInfo) {
        const user = JSON.parse(userInfo)
        console.log("User from localStorage:", user)
      } else {
        console.log("No user found in localStorage")
      }
    } catch (error) {
      console.error("Error reading user from localStorage:", error)
    }
  }, [])

  if (authStatus.checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checking Authentication...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent>
        {authStatus.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{authStatus.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p>
            <strong>Status:</strong> {authStatus.authenticated ? "Authenticated" : "Not Authenticated"}
          </p>

          {authStatus.authenticated && authStatus.user && (
            <>
              <p>
                <strong>User ID:</strong> {authStatus.user.uid}
              </p>
              <p>
                <strong>Email:</strong> {authStatus.user.email}
              </p>
              <p>
                <strong>Email Verified:</strong> {authStatus.user.emailVerified ? "Yes" : "No"}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

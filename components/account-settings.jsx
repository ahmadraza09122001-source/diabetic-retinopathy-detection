"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Alert, AlertDescription } from "./ui/alert"
import { useToast } from "../hooks/use-toast"

export default function AccountSettings() {
  const router = useRouter()
  const { toast } = useToast()

  const [hasPassword, setHasPassword] = useState(true)
  const [isCheckingPassword, setIsCheckingPassword] = useState(true)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetch("/api/account")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHasPassword(data.hasPassword)
      })
      .catch((err) => console.error("Error checking password status:", err))
      .finally(() => setIsCheckingPassword(false))
  }, [])

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError("")

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.")
      return
    }
    if (hasPassword && !currentPassword) {
      setPasswordError("Current password is required.")
      return
    }

    try {
      setIsChangingPassword(true)
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update password.")

      setHasPassword(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: hasPassword ? "Password updated" : "Password set",
        description: hasPassword
          ? "Your password has been changed successfully."
          : "You can now also sign in with your email and this password.",
      })
    } catch (error) {
      console.error("Error updating password:", error)
      setPasswordError(error.message || "Failed to update password.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete your account? This will remove your profile and all scan history, and cannot be undone.",
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete account.")

      await signOut({ callbackUrl: "/" })
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{hasPassword ? "Change Password" : "Set a Password"}</CardTitle>
          <CardDescription>
            {hasPassword
              ? "Update the password used to sign in to your account"
              : "You signed in with Google - add a password so you can also sign in with your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCheckingPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              {hasPassword && (
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm {hasPassword ? "New " : ""}Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isChangingPassword}>
                {isChangingPassword ? "Saving..." : hasPassword ? "Update Password" : "Set Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

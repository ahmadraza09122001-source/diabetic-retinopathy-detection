"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Alert, AlertDescription } from "./ui/alert"
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  linkWithCredential,
  deleteUser,
} from "firebase/auth"
import { auth } from "../firebase/config"
import { deleteUserProfile, deleteAllUserScans } from "../firebase/firestore"
import { useToast } from "../hooks/use-toast"

export default function AccountSettings() {
  const router = useRouter()
  const { toast } = useToast()

  const [firebaseUser, setFirebaseUser] = useState(null)
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setHasPasswordProvider(user?.providerData?.some((p) => p.providerId === "password") ?? false)
    })

    return () => unsubscribe()
  }, [])

  const handleSetPassword = async (e) => {
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

    try {
      setIsChangingPassword(true)
      const credential = EmailAuthProvider.credential(firebaseUser.email, newPassword)
      await linkWithCredential(firebaseUser, credential)
      setHasPasswordProvider(true)

      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Password set",
        description: "You can now also sign in with your email and this password.",
      })
    } catch (error) {
      console.error("Error setting password:", error)
      setPasswordError(error.message || "Failed to set password.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError("")

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.")
      return
    }

    try {
      setIsChangingPassword(true)
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword)
      await reauthenticateWithCredential(firebaseUser, credential)
      await updatePassword(firebaseUser, newPassword)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({ title: "Password updated", description: "Your password has been changed successfully." })
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError(
        error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
          ? "Current password is incorrect."
          : error.message || "Failed to update password.",
      )
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
      const userInfo = localStorage.getItem("user")
      const user = userInfo ? JSON.parse(userInfo) : null

      if (user?.uid) {
        await deleteAllUserScans(user.uid)
        await deleteUserProfile(user.uid)
      }

      await deleteUser(firebaseUser)

      localStorage.removeItem("user")
      document.cookie = "auth=; path=/; max-age=0"
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      if (error.code === "auth/requires-recent-login") {
        toast({
          title: "Please log in again",
          description: "For security, log out and log back in, then retry deleting your account.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete your account. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{hasPasswordProvider ? "Change Password" : "Set a Password"}</CardTitle>
          <CardDescription>
            {hasPasswordProvider
              ? "Update the password used to sign in to your account"
              : "You signed in with Google - add a password so you can also sign in with your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPasswordProvider ? (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
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
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isChangingPassword}>
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-4 max-w-md">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
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
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isChangingPassword}>
                {isChangingPassword ? "Setting..." : "Set Password"}
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

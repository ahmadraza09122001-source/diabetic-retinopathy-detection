"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Separator } from "./ui/separator"
import { Alert, AlertDescription } from "./ui/alert"
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from "firebase/auth"
import { auth } from "../firebase/config"
import { getUserProfile, saveUserProfile, deleteUserProfile, deleteAllUserScans } from "../firebase/firestore"
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

  const [emailOnScanComplete, setEmailOnScanComplete] = useState(true)
  const [emailOnSevereResult, setEmailOnSevereResult] = useState(true)
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setHasPasswordProvider(user?.providerData?.some((p) => p.providerId === "password") ?? false)
    })

    loadPreferences()

    return () => unsubscribe()
  }, [])

  const loadPreferences = async () => {
    try {
      const userInfo = localStorage.getItem("user")
      if (!userInfo) return
      const user = JSON.parse(userInfo)
      const profile = await getUserProfile(user.uid)
      if (profile) {
        if (typeof profile.emailOnScanComplete === "boolean") setEmailOnScanComplete(profile.emailOnScanComplete)
        if (typeof profile.emailOnSevereResult === "boolean") setEmailOnSevereResult(profile.emailOnSevereResult)
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error)
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

  const handleSavePreferences = async () => {
    try {
      setIsSavingPrefs(true)
      const userInfo = localStorage.getItem("user")
      if (!userInfo) throw new Error("User not found. Please log in again.")
      const user = JSON.parse(userInfo)

      await saveUserProfile(user.uid, { emailOnScanComplete, emailOnSevereResult })
      toast({ title: "Preferences saved", description: "Your notification preferences have been updated." })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPrefs(false)
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
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update the password used to sign in to your account</CardDescription>
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
            <p className="text-sm text-gray-500">
              You signed in with Google, so there's no password to change here. Manage your password through your
              Google account instead.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose when you'd like to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Email me when a scan completes</p>
              <p className="text-xs text-gray-500">Get notified once your uploaded image has been analyzed</p>
            </div>
            <Switch checked={emailOnScanComplete} onCheckedChange={setEmailOnScanComplete} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Email me for Severe or Proliferative results</p>
              <p className="text-xs text-gray-500">Extra alert for results that need urgent attention</p>
            </div>
            <Switch checked={emailOnSevereResult} onCheckedChange={setEmailOnSevereResult} />
          </div>
          <Button onClick={handleSavePreferences} className="bg-blue-600 hover:bg-blue-700" disabled={isSavingPrefs}>
            {isSavingPrefs ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
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

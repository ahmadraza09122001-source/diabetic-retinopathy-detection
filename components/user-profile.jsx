"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"
import { Badge } from "./ui/badge"
import { getUserProfile, saveUserProfile, deleteUserProfile } from "../firebase/firestore"
import { useToast } from "../hooks/use-toast"

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"]
const DIABETES_TYPES = ["Type 1", "Type 2", "Gestational", "Pre-diabetes", "Not diabetic"]

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

export default function UserProfile() {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [diabetesType, setDiabetesType] = useState("")
  const [diagnosisYear, setDiagnosisYear] = useState("")

  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const resetFields = (fallbackName = "") => {
    setFullName(fallbackName)
    setPhone("")
    setAge("")
    setGender("")
    setDiabetesType("")
    setDiagnosisYear("")
  }

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const userInfo = localStorage.getItem("user")
      if (!userInfo) throw new Error("User not found. Please log in again.")
      const user = JSON.parse(userInfo)

      const profile = await getUserProfile(user.uid)
      if (profile) {
        setHasProfile(true)
        setFullName(profile.fullName || user.fullName || "")
        setPhone(profile.phone || "")
        setAge(profile.age || "")
        setGender(profile.gender || "")
        setDiabetesType(profile.diabetesType || "")
        setDiagnosisYear(profile.diagnosisYear || "")
      } else {
        setHasProfile(false)
        resetFields(user.fullName || "")
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error",
        description: "Failed to load your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      const userInfo = localStorage.getItem("user")
      if (!userInfo) throw new Error("User not found. Please log in again.")
      const user = JSON.parse(userInfo)

      await saveUserProfile(user.uid, { fullName, phone, age, gender, diabetesType, diagnosisYear })
      setHasProfile(true)

      // Keep the display name in sync with localStorage/session state used elsewhere
      localStorage.setItem("user", JSON.stringify({ ...user, fullName }))

      toast({
        title: "Profile saved",
        description: "Your profile information has been updated.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete your saved profile? You can fill in a new one afterward.")) return

    try {
      setIsDeleting(true)
      const userInfo = localStorage.getItem("user")
      if (!userInfo) throw new Error("User not found. Please log in again.")
      const user = JSON.parse(userInfo)

      await deleteUserProfile(user.uid)
      setHasProfile(false)
      resetFields(user.fullName || "")

      toast({
        title: "Profile deleted",
        description: "Your profile has been removed. Fill in the form to create a new one.",
      })
    } catch (error) {
      console.error("Error deleting profile:", error)
      toast({
        title: "Error",
        description: "Failed to delete your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Loading your profile...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Manage your personal and medical information</CardDescription>
          </div>
          {hasProfile ? (
            <Badge className="bg-green-100 text-green-800 border-green-300">Profile saved</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600 border-gray-300">No profile yet</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500">Medical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diabetesType">Diabetes Type</Label>
                <select
                  id="diabetesType"
                  value={diabetesType}
                  onChange={(e) => setDiabetesType(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select type</option>
                  {DIABETES_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosisYear">Year of Diagnosis</Label>
                <Input
                  id="diagnosisYear"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={diagnosisYear}
                  onChange={(e) => setDiagnosisYear(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? "Saving..." : hasProfile ? "Update Profile" : "Save Profile"}
            </Button>
            {hasProfile && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Profile"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

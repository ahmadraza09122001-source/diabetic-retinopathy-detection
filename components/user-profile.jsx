"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"
import { getUserProfile, saveUserProfile } from "../firebase/firestore"
import { useToast } from "../hooks/use-toast"

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"]
const DIABETES_TYPES = ["Type 1", "Type 2", "Gestational", "Pre-diabetes", "Not diabetic"]

export default function UserProfile() {
  const [role, setRole] = useState("patient")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  // Patient fields
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [diabetesType, setDiabetesType] = useState("")
  const [diagnosisYear, setDiagnosisYear] = useState("")

  // Doctor fields
  const [specialization, setSpecialization] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [yearsExperience, setYearsExperience] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const userInfo = localStorage.getItem("user")
      if (!userInfo) throw new Error("User not found. Please log in again.")
      const user = JSON.parse(userInfo)

      setFullName(user.fullName || "")
      setEmail(user.email || "")

      const profile = await getUserProfile(user.uid)
      if (profile) {
        setRole(profile.role || "patient")
        setFullName(profile.fullName || user.fullName || "")
        setPhone(profile.phone || "")
        setAge(profile.age || "")
        setGender(profile.gender || "")
        setDiabetesType(profile.diabetesType || "")
        setDiagnosisYear(profile.diagnosisYear || "")
        setSpecialization(profile.specialization || "")
        setClinicName(profile.clinicName || "")
        setLicenseNumber(profile.licenseNumber || "")
        setYearsExperience(profile.yearsExperience || "")
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

      const profileData = {
        role,
        fullName,
        email,
        phone,
        ...(role === "patient"
          ? { age, gender, diabetesType, diagnosisYear }
          : { specialization, clinicName, licenseNumber, yearsExperience }),
      }

      await saveUserProfile(user.uid, profileData)

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
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Manage your personal and medical information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label>Account Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={role === "patient" ? "default" : "outline"}
                onClick={() => setRole("patient")}
                className={role === "patient" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                Patient
              </Button>
              <Button
                type="button"
                variant={role === "doctor" ? "default" : "outline"}
                onClick={() => setRole("doctor")}
                className={role === "doctor" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                Doctor
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="bg-gray-50" />
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

          {role === "patient" ? (
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g. Ophthalmology"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic / Hospital Name</Label>
                  <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Medical License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    max="70"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

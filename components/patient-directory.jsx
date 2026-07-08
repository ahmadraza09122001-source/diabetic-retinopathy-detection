"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { getUserProfile, getProfilesByRole } from "../firebase/firestore"
import { useToast } from "../hooks/use-toast"

export default function PatientDirectory() {
  const [isDoctor, setIsDoctor] = useState(null) // null = still checking
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadDirectory()
  }, [])

  const loadDirectory = async () => {
    try {
      setIsLoading(true)
      const userInfo = localStorage.getItem("user")
      if (!userInfo) throw new Error("User not found. Please log in again.")
      const user = JSON.parse(userInfo)

      const myProfile = await getUserProfile(user.uid)
      if (!myProfile || myProfile.role !== "doctor") {
        setIsDoctor(false)
        return
      }
      setIsDoctor(true)

      const [patientProfiles, doctorProfiles] = await Promise.all([
        getProfilesByRole("patient"),
        getProfilesByRole("doctor"),
      ])
      setPatients(patientProfiles)
      setDoctors(doctorProfiles)
    } catch (error) {
      console.error("Error loading patient directory:", error)
      toast({
        title: "Error",
        description: "Failed to load the directory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || isDoctor === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Directory</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isDoctor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Directory</CardTitle>
          <CardDescription>This section is only available to Doctor accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Set your account type to "Doctor" on the Profile page to access the patient directory.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patients ({patients.length})</CardTitle>
          <CardDescription>All patients registered on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-sm text-gray-500">No patient profiles have been saved yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Diabetes Type</TableHead>
                    <TableHead>Diagnosed</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.fullName || "N/A"}</TableCell>
                      <TableCell>{patient.email || "N/A"}</TableCell>
                      <TableCell>{patient.age || "N/A"}</TableCell>
                      <TableCell>{patient.gender || "N/A"}</TableCell>
                      <TableCell>
                        {patient.diabetesType ? (
                          <Badge variant="outline">{patient.diabetesType}</Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{patient.diagnosisYear || "N/A"}</TableCell>
                      <TableCell>{patient.phone || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctors ({doctors.length})</CardTitle>
          <CardDescription>All doctors registered on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-sm text-gray-500">No doctor profiles have been saved yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Clinic / Hospital</TableHead>
                    <TableHead>License No.</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-medium">{doctor.fullName || "N/A"}</TableCell>
                      <TableCell>{doctor.email || "N/A"}</TableCell>
                      <TableCell>{doctor.specialization || "N/A"}</TableCell>
                      <TableCell>{doctor.clinicName || "N/A"}</TableCell>
                      <TableCell>{doctor.licenseNumber || "N/A"}</TableCell>
                      <TableCell>{doctor.yearsExperience ? `${doctor.yearsExperience} yrs` : "N/A"}</TableCell>
                      <TableCell>{doctor.phone || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

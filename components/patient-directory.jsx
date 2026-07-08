"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { getUserProfile, getProfilesByRole, getUserScans } from "../firebase/firestore"
import { useToast } from "../hooks/use-toast"
import { formatGradeWithStage } from "../lib/dr-stage"

const DIABETES_TYPES = ["Type 1", "Type 2", "Gestational", "Pre-diabetes", "Not diabetic"]
const SEVERITY_LEVELS = ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"]

const getResultColor = (grade) => {
  const gradeMap = {
    "No DR": "bg-green-100 text-green-800 border-green-300",
    Mild: "bg-blue-100 text-blue-800 border-blue-300",
    Moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Severe: "bg-orange-100 text-orange-800 border-orange-300",
    "Proliferative DR": "bg-red-100 text-red-800 border-red-300",
  }
  for (const [key, value] of Object.entries(gradeMap)) {
    if (grade && grade.includes(key)) return value
  }
  return "bg-gray-100 text-gray-800 border-gray-300"
}

const selectClassName =
  "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

export default function PatientDirectory() {
  const [isDoctor, setIsDoctor] = useState(null) // null = still checking
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [diabetesFilter, setDiabetesFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
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

      // Attach each patient's most recent scan result for a quick at-a-glance view
      const patientsWithResults = await Promise.all(
        patientProfiles.map(async (patient) => {
          try {
            const scans = await getUserScans(patient.id)
            const latestScan = scans
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
            return { ...patient, latestResult: latestScan?.result || null, latestScanDate: latestScan?.date || null }
          } catch (err) {
            console.error(`Error loading scans for patient ${patient.id}:`, err)
            return { ...patient, latestResult: null, latestScanDate: null }
          }
        }),
      )

      setPatients(patientsWithResults)
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

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = (patient.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDiabetes = !diabetesFilter || patient.diabetesType === diabetesFilter
    const resultGrade = patient.latestResult?.class || patient.latestResult?.grade_label
    const matchesSeverity = !severityFilter || resultGrade === severityFilter
    return matchesSearch && matchesDiabetes && matchesSeverity
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patients ({filteredPatients.length} of {patients.length})</CardTitle>
          <CardDescription>All patients registered on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-xs"
            />
            <select
              value={diabetesFilter}
              onChange={(e) => setDiabetesFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="">All Diabetes Types</option>
              {DIABETES_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="">All Results</option>
              {SEVERITY_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {patients.length === 0 ? (
            <p className="text-sm text-gray-500">No patient profiles have been saved yet.</p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-sm text-gray-500">No patients match your search/filters.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Latest Result</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Diabetes Type</TableHead>
                    <TableHead>Diagnosed</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => {
                    const resultGrade = patient.latestResult?.class || patient.latestResult?.grade_label
                    return (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.fullName || "N/A"}</TableCell>
                        <TableCell>
                          {resultGrade ? (
                            <Badge variant="outline" className={getResultColor(resultGrade)}>
                              {formatGradeWithStage(resultGrade)}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">No scans yet</span>
                          )}
                        </TableCell>
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
                    )
                  })}
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

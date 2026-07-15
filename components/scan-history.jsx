"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { useToast } from "../hooks/use-toast"
import { generateScanReportPDF } from "../lib/pdf-report"
import { formatGradeWithStage } from "../lib/dr-stage"

export default function ScanHistory() {
  const { data: session } = useSession()
  const [history, setHistory] = useState([])
  const [selectedScan, setSelectedScan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadScanHistory()
  }, [])

  const loadScanHistory = async () => {
    try {
      setIsLoading(true)

      const res = await fetch("/api/scans")
      if (!res.ok) throw new Error("Failed to load scan history.")
      const scans = await res.json()
      setHistory(scans)

      // Select the first scan if available
      if (scans.length > 0 && !selectedScan) {
        setSelectedScan(scans[0])
      }
    } catch (error) {
      console.error("Error loading scan history:", error)
      toast({
        title: "Error",
        description: "Failed to load scan history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your scan history? This action cannot be undone.")) {
      try {
        // Delete each scan individually
        for (const scan of history) {
          await fetch(`/api/scans/${scan.id}`, { method: "DELETE" })
        }

        setHistory([])
        setSelectedScan(null)

        toast({
          title: "Success",
          description: "Your scan history has been cleared.",
        })
      } catch (error) {
        console.error("Error clearing scan history:", error)
        toast({
          title: "Error",
          description: "Failed to clear scan history. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteScan = async (scanId) => {
    try {
      const res = await fetch(`/api/scans/${scanId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete scan.")

      // Update the local state
      setHistory(history.filter((scan) => scan.id !== scanId))

      // If the deleted scan was selected, clear the selection
      if (selectedScan && selectedScan.id === scanId) {
        setSelectedScan(history.length > 1 ? history[0] : null)
      }

      toast({
        title: "Success",
        description: "Scan deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting scan:", error)
      toast({
        title: "Error",
        description: "Failed to delete scan. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewScan = (scan) => {
    setSelectedScan(scan)
  }

  const handleDownloadReport = async (scan) => {
    try {
      const profileRes = await fetch("/api/profile")
      const profile = profileRes.ok ? await profileRes.json() : null

      generateScanReportPDF({
        // Older scans saved before patient name/age were collected fall back
        // to the account's own name.
        patientName: scan.patientName || session?.user?.name,
        patientAge: scan.patientAge,
        gender: profile?.gender,
        phone: profile?.phone,
        fileName: scan.fileName,
        date: scan.date,
        imageDataUrl: scan.imagePreview || scan.imageUrl,
        result: scan.result,
      })
    } catch (error) {
      console.error("Failed to generate PDF report:", error)
      toast({
        title: "Error",
        description: "Failed to generate the PDF report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getDRGradeColor = (grade) => {
    const gradeMap = {
      "No DR": "bg-green-100 text-green-800",
      Mild: "bg-blue-100 text-blue-800",
      Moderate: "bg-yellow-100 text-yellow-800",
      Severe: "bg-orange-100 text-orange-800",
      "Proliferative DR": "bg-red-100 text-red-800",
    }

    // Try to match the grade text
    for (const [key, value] of Object.entries(gradeMap)) {
      if (grade && grade.includes(key)) {
        return value
      }
    }

    return "bg-gray-100 text-gray-800" // Default
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>Loading your scan history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>View your previous scan results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-gray-100 rounded-full p-4 inline-flex mb-4">
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
                className="h-5 w-5"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No scan history yet</h3>
            <p className="text-gray-500 mb-4">Upload your first retina image to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Scan History</CardTitle>
              <Button variant="outline" size="sm" onClick={handleClearHistory}>
                Clear All
              </Button>
            </div>
            <CardDescription>You have {history.length} saved scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {history.map((scan) => (
                <div
                  key={scan.id}
                  className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedScan?.id === scan.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleViewScan(scan)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      {scan.imagePreview && (
                        <img
                          src={scan.imagePreview || scan.imageUrl || "/placeholder.svg"}
                          alt="Scan preview"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{scan.patientName || scan.fileName}</p>
                      <p className="text-xs text-gray-500">{formatDate(scan.date)}</p>
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className={getDRGradeColor(scan.result.class || scan.result.grade_label)}
                        >
                          {formatGradeWithStage(scan.result.class || scan.result.grade_label) || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteScan(scan.id)
                      }}
                    >
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
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        {selectedScan ? (
          <Card>
            <CardHeader>
              <CardTitle>{selectedScan.patientName || "Scan Details"}</CardTitle>
              <CardDescription>
                {selectedScan.patientAge && `Age ${selectedScan.patientAge} • `}
                {selectedScan.fileName} • {formatDate(selectedScan.date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="rounded-lg overflow-hidden border bg-gray-50 h-64 flex items-center justify-center">
                    {selectedScan.imagePreview || selectedScan.imageUrl ? (
                      <img
                        src={selectedScan.imagePreview || selectedScan.imageUrl || "/placeholder.svg"}
                        alt="Retina scan"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <p className="text-gray-500">No image preview available</p>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500">Image Information</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">File Name:</span>
                        <span className="text-sm font-medium">{selectedScan.fileName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">File Size:</span>
                        <span className="text-sm font-medium">
                          {(selectedScan.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Scan Date:</span>
                        <span className="text-sm font-medium">{formatDate(selectedScan.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">
                      Diagnosis:
                      <span
                        className={`ml-2 px-2 py-1 rounded text-sm ${getDRGradeColor(
                          selectedScan.result.class || selectedScan.result.grade_label,
                        )}`}
                      >
                        {formatGradeWithStage(selectedScan.result.class || selectedScan.result.grade_label) ||
                          "Unknown"}
                      </span>
                    </h3>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Recommendations</h4>
                        <div className="p-3 bg-white rounded border text-sm">
                          {selectedScan.result.class === "No DR" ||
                          (selectedScan.result.grade_label && selectedScan.result.grade_label.includes("No DR")) ? (
                            <p>No signs of diabetic retinopathy detected. Continue regular annual screening.</p>
                          ) : selectedScan.result.class === "Mild" ||
                            (selectedScan.result.grade_label && selectedScan.result.grade_label.includes("Mild")) ? (
                            <p>
                              Mild non-proliferative diabetic retinopathy detected. Follow up with your eye care
                              provider within 6-12 months.
                            </p>
                          ) : selectedScan.result.class === "Moderate" ||
                            (selectedScan.result.grade_label &&
                              selectedScan.result.grade_label.includes("Moderate")) ? (
                            <p>
                              Moderate non-proliferative diabetic retinopathy detected. Follow up with your eye care
                              provider within 3-6 months.
                            </p>
                          ) : selectedScan.result.class === "Severe" ||
                            (selectedScan.result.grade_label && selectedScan.result.grade_label.includes("Severe")) ? (
                            <p>
                              Severe non-proliferative diabetic retinopathy detected. Follow up with your eye care
                              provider within 1-3 months.
                            </p>
                          ) : selectedScan.result.class === "Proliferative DR" ||
                            (selectedScan.result.grade_label &&
                              selectedScan.result.grade_label.includes("Proliferative")) ? (
                            <p>
                              Proliferative diabetic retinopathy detected. Urgent referral to an ophthalmologist is
                              recommended.
                            </p>
                          ) : (
                            <p>Please consult with your healthcare provider for interpretation of these results.</p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDownloadReport(selectedScan)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Download Report (PDF)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
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
                  className="h-12 w-12 mx-auto text-gray-400 mb-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3 className="text-lg font-medium mb-2">No scan selected</h3>
                <p className="text-gray-500 mb-4">Select a scan from the list to view details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

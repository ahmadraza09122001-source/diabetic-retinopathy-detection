"use client"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Progress } from "./ui/progress"
import { Alert, AlertTitle, AlertDescription } from "./ui/alert"
import { saveScan, getUserProfile } from "../firebase/firestore"
import { useToast } from "../hooks/use-toast"
import { generateScanReportPDF } from "../lib/pdf-report"
// Update the import for FirestoreTest
import FirestoreTest from "./firestore-test"

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

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

// Firestore rejects any document over 1,048,487 bytes, and a full-resolution
// upload (up to MAX_FILE_SIZE_MB, base64-inflated ~33%) blows past that on its
// own. Scan history only ever needs a small thumbnail, so downscale + recompress
// before saving instead of storing the original image.
const createThumbnail = (dataUrl, maxDim = 400, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else if (height >= width && height > maxDim) {
        width = Math.round((width * maxDim) / height)
        height = maxDim
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      canvas.getContext("2d").drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.onerror = () => reject(new Error("Failed to load image for thumbnail"))
    img.src = dataUrl
  })
}

// Lightweight client-side heuristic check (blur via Laplacian variance, plus
// brightness) so obviously unusable photos are rejected instantly instead of
// wasting a round trip to the model. This is a best-effort heuristic, not a
// substitute for the backend's own retina-image validation.
const checkImageQuality = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const size = 200
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        const gray = new Float32Array(size * size)
        let sum = 0
        for (let i = 0; i < size * size; i++) {
          const v = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
          gray[i] = v
          sum += v
        }
        const meanBrightness = sum / (size * size)

        let lapSum = 0
        let lapSumSq = 0
        let count = 0
        for (let y = 1; y < size - 1; y++) {
          for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x
            const lap = gray[idx - size] + gray[idx + size] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx]
            lapSum += lap
            lapSumSq += lap * lap
            count++
          }
        }
        const lapMean = lapSum / count
        const variance = lapSumSq / count - lapMean * lapMean

        if (meanBrightness < 25) {
          resolve({ ok: false, message: "This image looks too dark to analyze. Please upload a clearer, well-lit retinal image." })
        } else if (meanBrightness > 235) {
          resolve({ ok: false, message: "This image looks overexposed. Please upload a clearer retinal image." })
        } else if (variance < 15) {
          resolve({ ok: false, message: "This image appears too blurry to analyze. Please upload a sharper retinal image." })
        } else {
          resolve({ ok: true })
        }
      } catch {
        resolve({ ok: true }) // don't block upload if the check itself fails
      }
    }
    img.onerror = () => resolve({ ok: true })
    img.src = dataUrl
  })
}

export default function UploadImage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [errorTitle, setErrorTitle] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [patientName, setPatientName] = useState("")
  const [patientAge, setPatientAge] = useState("")
  const [savedProfile, setSavedProfile] = useState(null)
  const { toast } = useToast()

  // Pre-fill patient name/age from the saved profile (if this account has one)
  // so a patient scanning their own image doesn't have to retype it - a doctor
  // scanning on behalf of someone else can just overwrite these fields.
  useEffect(() => {
    const userInfo = localStorage.getItem("user")
    if (!userInfo) return
    const user = JSON.parse(userInfo)

    setPatientName(user.fullName || "")

    getUserProfile(user.uid)
      .then((profile) => {
        if (!profile) return
        setSavedProfile(profile)
        if (profile.fullName) setPatientName(profile.fullName)
        if (profile.role === "patient" && profile.age) setPatientAge(String(profile.age))
      })
      .catch((err) => console.error("Error loading profile for upload form:", err))
  }, [])

  // Shared by both the file-picker input and drag-and-drop, so validation
  // (size, quality) stays identical regardless of how the file arrived.
  const processFile = (file, inputEl) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrorTitle("Invalid File Type")
      setError("Please upload an image file (JPG or PNG).")
      if (inputEl) inputEl.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorTitle("File Too Large")
      setError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`)
      if (inputEl) inputEl.value = ""
      return
    }

    // Reset states
    setResult(null)
    setError(null)
    setErrorTitle(null)
    setUploadProgress(0)

    // Create preview URL, then run a quick client-side quality check
    const reader = new FileReader()
    reader.onload = async (readerEvent) => {
      const dataUrl = readerEvent.target?.result
      if (!dataUrl) return

      const quality = await checkImageQuality(dataUrl)
      if (!quality.ok) {
        setErrorTitle("Poor Image Quality")
        setError(quality.message)
        setImage(null)
        setPreview(null)
        if (inputEl) inputEl.value = ""
        return
      }

      setImage(file)
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleChange = (e) => {
    processFile(e.target.files[0], e.target)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!image) {
      setErrorTitle("No Image Selected")
      setError("Please select an image to upload")
      return
    }

    if (!patientName.trim() || !patientAge.trim()) {
      setErrorTitle("Patient Information Required")
      setError("Please enter the patient's name and age before starting the analysis.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setErrorTitle(null)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append("image", image)

      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const message = data?.error || `Server responded with status: ${res.status}`
        const err = new Error(message)
        // The backend returns 400 with a specific message when the image fails
        // its retina-scan validation - surface that distinctly from generic errors.
        err.title = res.status === 400 && data?.error ? "Invalid Image" : "Upload Error"
        throw err
      }

      console.log("Prediction result:", data)

      // Save result to state
      setResult(data)

      // Get user from localStorage
      const userInfo = localStorage.getItem("user")
      if (!userInfo) {
        throw new Error("User not found. Please log in again.")
      }

      const user = JSON.parse(userInfo)

      // Downscale before saving - Firestore rejects documents over ~1MB and a
      // full-resolution upload can exceed that on its own.
      let thumbnail = null
      try {
        thumbnail = await createThumbnail(preview)
      } catch (thumbErr) {
        console.error("Thumbnail generation failed:", thumbErr)
      }

      // Save to Firestore
      console.log("Attempting to save scan to Firestore with user ID:", user.uid)
      await saveScan(user.uid, {
        fileName: image?.name || "Unknown",
        fileSize: image?.size || 0,
        result: data,
        imagePreview: thumbnail,
        patientName: patientName.trim(),
        patientAge: patientAge.trim(),
      })
      console.log("Scan saved successfully to Firestore")

      toast({
        title: "Scan saved successfully",
        description: "Your scan has been saved to your history",
      })
    } catch (err) {
      console.error("Upload error:", err)
      setErrorTitle(err.title || "Upload Error")
      setError(err.message || "Failed to upload image. Please try again.")
      toast({
        title: err.title || "Error",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setErrorTitle(null)
    setUploadProgress(0)
  }

  const handleDownloadReport = () => {
    try {
      generateScanReportPDF({
        patientName,
        patientAge,
        gender: savedProfile?.role === "patient" ? savedProfile.gender : undefined,
        diabetesType: savedProfile?.role === "patient" ? savedProfile.diabetesType : undefined,
        diagnosisYear: savedProfile?.role === "patient" ? savedProfile.diagnosisYear : undefined,
        phone: savedProfile?.phone,
        fileName: image?.name,
        date: new Date().toISOString(),
        imageDataUrl: preview,
        result,
      })
    } catch (err) {
      console.error("Failed to generate PDF report:", err)
      toast({
        title: "Error",
        description: "Failed to generate the PDF report. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Retinal Image</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            {errorTitle && <AlertTitle>{errorTitle}</AlertTitle>}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!image ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
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
              className="h-10 w-10 text-blue-600"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1 mt-4">Drag and drop your image here</h3>
            <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG (max 5MB)</p>
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
                <input id="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleChange} />
              </label>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100">
                  {preview && (
                    <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium">{image.name}</h4>
                  <p className="text-xs text-gray-500">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
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
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>

            {!result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="patient-name">Patient Name</Label>
                  <Input
                    id="patient-name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient's full name"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-age">Patient Age</Label>
                  <Input
                    id="patient-age"
                    type="number"
                    min="0"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="Enter patient's age"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {!isLoading && !result && (
              <Button onClick={handleUpload} className="w-full">
                Start Analysis
              </Button>
            )}

            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div
                  className={`flex items-center px-4 py-3 rounded-lg border mb-4 ${getResultColor(
                    result.class || result.grade_label,
                  )}`}
                >
                  <span className="font-semibold">Result: {result.class || result.grade_label || "Unknown"}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleDownloadReport} variant="outline" size="sm">
                    Download Report (PDF)
                  </Button>
                  <Button onClick={handleClear} variant="outline" size="sm">
                    Upload New Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-6">
          
        </div>
      </CardContent>
    </Card>
  )
}

"use client"
import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Alert, AlertDescription } from "./ui/alert"
import { saveScan } from "../firebase/firestore"
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

export default function UploadImage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`)
      e.target.value = ""
      return
    }

    setImage(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result)
      }
    }
    reader.readAsDataURL(file)

    // Reset states
    setResult(null)
    setError(null)
    setUploadProgress(0)
  }

  const handleUpload = async () => {
    if (!image) {
      setError("Please select an image to upload")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

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

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const data = await res.json()
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
      })
      console.log("Scan saved successfully to Firestore")

      toast({
        title: "Scan saved successfully",
        description: "Your scan has been saved to your history",
      })
    } catch (err) {
      console.error("Upload error:", err)
      setError(err.message || "Failed to upload image. Please try again.")
      toast({
        title: "Error",
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
    setUploadProgress(0)
  }

  const handleDownloadReport = () => {
    try {
      const userInfo = localStorage.getItem("user")
      const user = userInfo ? JSON.parse(userInfo) : null

      generateScanReportPDF({
        patientName: user?.fullName,
        patientEmail: user?.email,
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!image ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
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
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border mb-4 ${getResultColor(
                    result.class || result.grade_label,
                  )}`}
                >
                  <span className="font-semibold">Result: {result.class || result.grade_label || "Unknown"}</span>
                  {result.confidence && (
                    <span className="text-sm font-medium">
                      {(
                        (typeof result.confidence === "object"
                          ? Math.max(...Object.values(result.confidence))
                          : result.confidence) * 100
                      ).toFixed(1)}
                      % confidence
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">Prediction: {result.class || result.grade_label}</h3>
                <div className="space-y-2">
                  {result.confidence && typeof result.confidence === "object" ? (
                    Object.entries(result.confidence).map(([label, score]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${score * 100}%` }}></div>
                          </div>
                          <span className="text-sm font-medium">{(score * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>
                      Confidence:{" "}
                      {typeof result.confidence === "number"
                        ? `${(result.confidence * 100).toFixed(2)}%`
                        : JSON.stringify(result.confidence)}
                    </p>
                  )}
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

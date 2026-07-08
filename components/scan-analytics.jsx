"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { getUserAnalytics } from "../firebase/firestore"
import { useToast } from "../hooks/use-toast"

// Colors for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

// Numeric severity scale used for the trend chart's Y axis
const SEVERITY_LABELS = ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"]
const severityScore = (grade) => {
  const idx = SEVERITY_LABELS.indexOf(grade)
  return idx === -1 ? 0 : idx
}

export default function ScanAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [distributionData, setDistributionData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)

      // Get user from localStorage
      const userInfo = localStorage.getItem("user")
      if (!userInfo) {
        throw new Error("User not found. Please log in again.")
      }

      const user = JSON.parse(userInfo)

      // Fetch analytics from Firestore
      const analyticsData = await getUserAnalytics(user.uid)
      setAnalytics(analyticsData)

      // Process monthly data for chart
      const monthlyChartData = Object.entries(analyticsData.monthlyScans || {})
        .map(([month, count]) => ({
          month: formatMonth(month),
          scans: count,
        }))
        .sort((a, b) => {
          // Sort by date (assuming format is "MMM YYYY")
          const dateA = new Date(a.month)
          const dateB = new Date(b.month)
          return dateA - dateB
        })
        .slice(-6) // Only show last 6 months

      setMonthlyData(monthlyChartData)

      // Process distribution data for pie chart
      const distributionChartData = Object.entries(analyticsData.drGrades || {})
        .map(([grade, count]) => ({
          name: grade,
          value: count,
        }))
        .filter((item) => item.value > 0) // Only include non-zero values

      setDistributionData(distributionChartData)

      // Process severity trend across individual scans, oldest to newest
      const trendChartData = (analyticsData.scans || [])
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((scan) => {
          const grade = scan.result?.class || scan.result?.grade_label || "No DR"
          return {
            date: new Date(scan.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            severity: severityScore(grade),
            grade,
          }
        })

      setTrendData(trendChartData)
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatMonth = (monthStr) => {
    try {
      const [year, month] = monthStr.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    } catch (error) {
      return monthStr
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Loading your scan analytics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics || analytics.totalScans === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View analytics and insights from your scans</CardDescription>
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
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 17V9" />
                <path d="M12 17v-5" />
                <path d="M16 17v-3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No analytics available</h3>
            <p className="text-gray-500 mb-4">Upload images to see analytics and insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
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
                  className="h-5 w-5 text-blue-600"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Total Scans</h3>
              <p className="text-3xl font-bold mt-1">{analytics.totalScans}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-green-100 p-3 rounded-full mb-2">
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
                  className="h-5 w-5 text-green-600"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Most Common</h3>
              <p className="text-xl font-bold mt-1">
                {Object.entries(analytics.drGrades).sort((a, b) => b[1] - a[1])[0][0]}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-yellow-100 p-3 rounded-full mb-2">
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
                  className="h-5 w-5 text-yellow-600"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Severe Cases</h3>
              <p className="text-3xl font-bold mt-1">
                {(analytics.drGrades["Severe"] || 0) + (analytics.drGrades["Proliferative DR"] || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-purple-100 p-3 rounded-full mb-2">
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
                  className="h-5 w-5 text-purple-600"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Last Month</h3>
              <p className="text-3xl font-bold mt-1">
                {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].scans : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Scan Activity</CardTitle>
            <CardDescription>Number of scans performed each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="scans" fill="#3b82f6" name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Not enough data to display chart</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DR Grade Distribution</CardTitle>
            <CardDescription>Distribution of diagnosis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Not enough data to display chart</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Severity Trend Over Time</CardTitle>
          <CardDescription>Track how your DR grade changes across scans, oldest to newest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    tickFormatter={(value) => SEVERITY_LABELS[value]}
                    width={110}
                  />
                  <Tooltip
                    formatter={(_value, _name, props) => [props.payload.grade, "Diagnosis"]}
                    labelFormatter={(label) => `Scan date: ${label}`}
                  />
                  <Line type="monotone" dataKey="severity" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Need at least 2 scans to show a trend</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DR Grade Breakdown</CardTitle>
          <CardDescription>Detailed breakdown of your scan results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(analytics.drGrades).map(([grade, count]) => (
              <div key={grade} className="bg-gray-50 p-4 rounded-lg border text-center">
                <Badge
                  variant="outline"
                  className={`mb-2 ${
                    grade === "No DR"
                      ? "bg-green-100 text-green-800"
                      : grade === "Mild"
                        ? "bg-blue-100 text-blue-800"
                        : grade === "Moderate"
                          ? "bg-yellow-100 text-yellow-800"
                          : grade === "Severe"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                  }`}
                >
                  {grade}
                </Badge>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-gray-500">
                  {analytics.totalScans > 0 ? `${((count / analytics.totalScans) * 100).toFixed(1)}%` : "0%"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

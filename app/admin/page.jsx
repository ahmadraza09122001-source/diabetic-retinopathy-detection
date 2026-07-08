"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, BarChart2, Search, Filter, Download, Trash2, Edit, Eye, AlertCircle } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAlert, setShowAlert] = useState(false)

  // Mock data
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "Active", lastLogin: "2023-06-15" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Active", lastLogin: "2023-06-14" },
    { id: 3, name: "Robert Johnson", email: "robert@example.com", status: "Inactive", lastLogin: "2023-05-20" },
    { id: 4, name: "Emily Davis", email: "emily@example.com", status: "Active", lastLogin: "2023-06-12" },
    { id: 5, name: "Michael Wilson", email: "michael@example.com", status: "Active", lastLogin: "2023-06-10" },
  ]

  const recentUploads = [
    { id: 1, user: "John Doe", date: "2023-06-15", prediction: "Mild DR", confidence: "85%" },
    { id: 2, user: "Jane Smith", date: "2023-06-14", prediction: "No DR", confidence: "92%" },
    { id: 3, user: "Robert Johnson", date: "2023-06-13", prediction: "Moderate DR", confidence: "78%" },
    { id: 4, user: "Emily Davis", date: "2023-06-12", prediction: "Severe DR", confidence: "89%" },
    { id: 5, user: "Michael Wilson", date: "2023-06-10", prediction: "No DR", confidence: "95%" },
  ]

  const handleDelete = () => {
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <DashboardSidebar />

        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {showAlert && (
              <Alert variant="success" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Action completed successfully!</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Total Users</p>
                      <h3 className="text-2xl font-bold">128</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-full">
                      <BarChart2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Total Scans</p>
                      <h3 className="text-2xl font-bold">1,542</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <Eye className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Positive Detections</p>
                      <h3 className="text-2xl font-bold">342</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="users" onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="uploads">Recent Uploads</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="ml-4">
                        <Button variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    user.status === "Active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {user.status}
                                </span>
                              </TableCell>
                              <TableCell>{user.lastLogin}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={handleDelete}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="uploads" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Uploads</CardTitle>
                    <CardDescription>View recent image uploads and their predictions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search uploads..." className="pl-10" />
                      </div>
                      <div className="ml-4">
                        <Button variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Prediction</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentUploads.map((upload) => (
                            <TableRow key={upload.id}>
                              <TableCell className="font-medium">{upload.user}</TableCell>
                              <TableCell>{upload.date}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    upload.prediction === "No DR"
                                      ? "bg-green-100 text-green-800"
                                      : upload.prediction === "Mild DR"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : upload.prediction === "Moderate DR"
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {upload.prediction}
                                </span>
                              </TableCell>
                              <TableCell>{upload.confidence}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={handleDelete}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Configure system settings and AI model parameters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="confidence-threshold">Confidence Threshold (%)</Label>
                        <Input id="confidence-threshold" type="number" defaultValue="75" min="0" max="100" />
                        <p className="text-sm text-gray-500">
                          Minimum confidence level required for positive detection
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                        <Input id="max-file-size" type="number" defaultValue="5" min="1" max="20" />
                        <p className="text-sm text-gray-500">Maximum allowed file size for image uploads</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="model-version">AI Model Version</Label>
                        <Input
                          id="model-version"
                          defaultValue="EfficientNet Ensemble v1.0 (3-model average)"
                          disabled
                        />
                        <p className="text-sm text-gray-500">Current AI model version in use</p>
                      </div>

                      <Button className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}


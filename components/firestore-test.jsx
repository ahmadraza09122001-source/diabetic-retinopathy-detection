"use client"

import { useState } from "react"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "../firebase/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FirestoreTest() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testData, setTestData] = useState([])

  const testFirestoreWrite = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      // Try to add a test document to Firestore
      const testCollection = collection(db, "test_collection")
      const docRef = await addDoc(testCollection, {
        message: "Test document",
        timestamp: new Date().toISOString(),
      })

      setResult(`Success! Document written with ID: ${docRef.id}`)
    } catch (err) {
      console.error("Error testing Firestore:", err)
      setError(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFirestoreRead = async () => {
    setIsLoading(true)
    setTestData([])
    setError(null)

    try {
      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      // Try to read from Firestore
      const testCollection = collection(db, "test_collection")
      const querySnapshot = await getDocs(testCollection)

      const data = []
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() })
      })

      setTestData(data)
      setResult(`Success! Read ${data.length} documents`)
    } catch (err) {
      console.error("Error reading from Firestore:", err)
      setError(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firestore Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-4 mb-4">
          <Button onClick={testFirestoreWrite} disabled={isLoading}>
            {isLoading ? "Testing..." : "Test Write"}
          </Button>
          <Button onClick={testFirestoreRead} disabled={isLoading} variant="outline">
            {isLoading ? "Testing..." : "Test Read"}
          </Button>
        </div>

        {testData.length > 0 && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="font-medium mb-2">Test Documents:</h3>
            <div className="space-y-2">
              {testData.map((doc) => (
                <div key={doc.id} className="p-2 bg-gray-50 rounded">
                  <p>
                    <strong>ID:</strong> {doc.id}
                  </p>
                  <p>
                    <strong>Message:</strong> {doc.message}
                  </p>
                  <p>
                    <strong>Timestamp:</strong> {doc.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

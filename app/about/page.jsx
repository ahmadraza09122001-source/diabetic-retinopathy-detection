import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Database, Shield } from "lucide-react"

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-blue-50 py-16">
          <div className="container text-center">
            <h1 className="text-4xl font-bold mb-6 text-gray-900">About Diabetic Retinopathy Detection</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our mission is to make early detection of diabetic retinopathy accessible to everyone, helping to prevent
              vision loss and blindness.
            </p>
          </div>
        </section>

        {/* What is DR Section */}
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-gray-900">What is Diabetic Retinopathy?</h2>
                <p className="text-gray-600 mb-4">
                  Diabetic retinopathy is a diabetes complication that affects the eyes. It's caused by damage to the
                  blood vessels in the retina, the light-sensitive tissue at the back of the eye.
                </p>
                <p className="text-gray-600 mb-4">
                  At first, diabetic retinopathy may cause no symptoms or only mild vision problems. But it can
                  eventually lead to blindness if left untreated.
                </p>
                <p className="text-gray-600 mb-6">
                  The condition can develop in anyone who has type 1 or type 2 diabetes. The longer you have diabetes
                  and the less controlled your blood sugar is, the more likely you are to develop this eye complication.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/signup">Start Screening Today</Link>
                </Button>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img
                  src="/placeholder.jpg"
                  alt="Diabetic Retinopathy Illustration"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* AI Detection Section */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">How AI is Used for Early Detection</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 rounded-lg overflow-hidden shadow-lg">
                <img src="/placeholder.jpg" alt="AI Detection Process" className="w-full h-auto" />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Advanced Deep Learning Models</h3>
                <p className="text-gray-600 mb-4">
                  Our platform uses an ensemble of three specialized EfficientNet models, combining their predictions
                  to analyze retinal images with high accuracy.
                </p>
                <p className="text-gray-600 mb-4">
                  The AI has been trained on thousands of labeled retinal images, allowing it to identify subtle signs
                  of diabetic retinopathy that might be missed in routine examinations.
                </p>
                <p className="text-gray-600 mb-4">Our system can classify retinal images into five categories:</p>
                <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                  <li>No DR - Healthy retina</li>
                  <li>Mild DR - Early stage with minimal changes</li>
                  <li>Moderate DR - More noticeable changes</li>
                  <li>Severe DR - Significant changes requiring attention</li>
                  <li>Proliferative DR - Advanced stage requiring immediate treatment</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Model & Dataset Section */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">Model & Dataset Information</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Brain className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold mb-3">Ensemble AI Model</h3>
                    <p className="text-gray-600">
                      Our system combines the strengths of three specialized EfficientNet models to
                      achieve superior accuracy in detecting diabetic retinopathy.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Database className="h-12 w-12 text-green-600 mb-4" />
                    <h3 className="text-xl font-bold mb-3">Comprehensive Dataset</h3>
                    <p className="text-gray-600">
                      Trained on over 50,000 high-resolution retinal images from diverse populations to ensure accuracy
                      across different demographics.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Shield className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold mb-3">Validated Accuracy</h3>
                    <p className="text-gray-600">
                      Our model has been validated with 80% accuracy, making it a reliable
                      tool for early detection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Protect Your Vision?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust our platform for early detection of diabetic retinopathy.
            </p>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-blue-600"
            >
              <Link href="/signup">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Diabetic Retinopathy Detection</h3>
              <p className="text-gray-400">
                Early detection is crucial for preventing vision loss from diabetic retinopathy.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-gray-400 hover:text-white">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p className="text-gray-400">
                Email: info@drdetection.com
                <br />
                Phone: (123) 456-7890
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Diabetic Retinopathy Detection. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


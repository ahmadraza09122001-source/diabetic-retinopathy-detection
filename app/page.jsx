import Link from "next/link"
import { Navbar } from "../components/navbar"

// Simple icon components to replace lucide-react
const EyeIcon = () => (
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
    className="mr-2"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const ShieldIcon = () => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const BrainIcon = () => (
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
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
)

const UploadIcon = () => (
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
)

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section - Exactly matching the first image */}
      <section className="relative h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 z-0"></div>
        <div className="container mx-auto px-4 relative z-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Early Detection Saves Sight</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Our AI-powered platform detects diabetic retinopathy in its early stages, helping prevent vision loss and
            blindness.
          </p>
          <div className="flex flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md font-medium px-4 py-2 bg-green-500 text-white hover:bg-green-600"
            >
              Upload Image
            </a>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-md font-medium px-4 py-2 bg-white text-blue-700 hover:bg-gray-100"
            >
              Sign Up to Access
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">
            Advanced Retinopathy Detection
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard
              icon={<UploadIcon />}
              title="Upload Retinal Image for AI-Based Detection"
              description="Securely upload your retinal images and receive instant AI-powered analysis and detection results."
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title="Secure & Fast Analysis"
              description="Your data is encrypted and protected. Get accurate results within seconds of uploading your images."
            />
            <FeatureCard
              icon={<BrainIcon />}
              title="Advanced Deep Learning Models"
              description="Our detection system uses an ensemble of three specialized EfficientNet models for superior accuracy."
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Exactly matching the second image */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Start Monitoring Your Eye Health Today</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of users who trust our platform for early detection and monitoring of diabetic retinopathy.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-md font-medium px-4 py-2 bg-green-500 text-white hover:bg-green-600"
          >
            Create Your Free Account
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <EyeIcon /> Diabetic Retinopathy Detection
              </h3>
              <p className="text-blue-200 max-w-md">
                AI-powered diabetic retinopathy detection platform helping prevent vision loss through early detection.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-lg mb-4">Platform</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-blue-200 hover:text-white">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-blue-200 hover:text-white">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-blue-200 hover:text-white">
                      Dashboard
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4">Account</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/login" className="text-blue-200 hover:text-white">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="text-blue-200 hover:text-white">
                      Sign Up
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about#faq" className="text-blue-200 hover:text-white">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/about#research" className="text-blue-200 hover:text-white">
                      Research
                    </Link>
                  </li>
                  <li>
                    <Link href="/about#contact" className="text-blue-200 hover:text-white">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-12 pt-8 text-center text-blue-200">
            <p>© {new Date().getFullYear()} Diabetic Retinopathy Detection. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

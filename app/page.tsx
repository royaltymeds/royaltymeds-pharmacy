import Link from "next/link";
import {
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CheckCircleIcon,
} from "lucide-react";

// Color palette: Green (primary), Blue (secondary), White (background/text)
// Green: #15803d to #16a34a
// Blue: #0284c7 to #06b6d4
// White: #ffffff

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">RoyaltyMeds</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="hidden md:block text-gray-700 hover:text-green-600 transition"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden md:block text-gray-700 hover:text-green-600 transition"
            >
              How It Works
            </a>
            <Link
              href="/login"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Your Trusted Online{" "}
            <span className="text-green-600">Pharmacy</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Fast, affordable prescription delivery with licensed pharmacists
            available to answer your questions. Get your medications delivered
            right to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg"
            >
              Get Started
            </Link>
            <button className="px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-lg">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose RoyaltyMeds?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Licensed Pharmacists
              </h3>
              <p className="text-gray-600">
                All our pharmacists are fully licensed and verified for your
                safety and peace of mind.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Fast Delivery
              </h3>
              <p className="text-gray-600">
                Most prescriptions delivered within 24-48 hours to your home or
                preferred location.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <CreditCardIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Affordable Pricing
              </h3>
              <p className="text-gray-600">
                Competitive prices and transparent billing with insurance
                integration available.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <PhoneIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                24/7 Support
              </h3>
              <p className="text-gray-600">
                Our customer service team is available round-the-clock to help
                you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Account
              </h3>
              <p className="text-gray-600">
                Sign up in minutes with your personal information and medical
                history.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Prescription
              </h3>
              <p className="text-gray-600">
                Submit your prescription from your doctor via upload or have
                them send it directly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Review & Checkout
              </h3>
              <p className="text-gray-600">
                Our pharmacists review your prescription and you pay securely
                through our platform.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Receive Medication
              </h3>
              <p className="text-gray-600">
                Your medications are carefully prepared and delivered to your
                door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            What Our Customers Love
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              "Easy prescription uploads and tracking",
              "Secure platform with trusted pharmacists",
              "Expert pharmacist consultations",
              "Automatic refill reminders",
              "Multiple payment options",
              "Discreet and confidential service",
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section - Dynamic, shows only when reviews exist */}
      {/* This section will be populated dynamically when customers submit reviews through the portal */}
      {/* TODO: Connect to database reviews table and render scrolling carousel */}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-green-50 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust RoyaltyMeds for
            their prescription needs.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
          >
            Create Your Account Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-xl font-bold text-white">RoyaltyMeds</span>
              </div>
              <p className="text-sm text-gray-400">
                Your trusted online pharmacy partner.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-green-400 transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-green-400 transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-400 transition">
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4" />
                  <a
                    href="mailto:support@royaltymeds.com"
                    className="hover:text-green-400 transition"
                  >
                    support@royaltymeds.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  <a href="tel:1-800-ROYALTY" className="hover:text-green-400 transition">
                    1-800-ROYALTY
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  <span>Available 24/7</span>
                </li>
              </ul>
            </div>

            {/* Pharmacist Access */}
            <div>
              <h4 className="font-semibold text-white mb-4">For Pharmacists</h4>
              <Link
                href="/admin-login"
                className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-center text-sm"
              >
                Pharmacist Portal
              </Link>
              <p className="text-xs text-gray-400 mt-4">
                Licensed pharmacists only
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>
              &copy; 2026 RoyaltyMeds. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-green-400 transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-green-400 transition">
                Terms of Service
              </a>
              <a href="#" className="hover:text-green-400 transition">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

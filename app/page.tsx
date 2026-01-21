import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CheckCircleIcon,
  Heart,
  Truck,
  Pill,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/royaltymeds_logo.jpeg"
                alt="RoyaltyMeds Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              <span className="text-green-600">R</span>oyaltyMeds
            </span>
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
              href="/store"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Start Ordering
            </Link>
            <Link
              href="/login"
              className="px-6 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Your Trusted Online{" "}
              <span className="text-green-600">Pharmacy</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Fast, affordable prescription and over-the-counter medication delivery with licensed pharmacists available to answer your questions. Get your medications delivered right to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/store"
                className="inline-block px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg text-center"
              >
                Start Ordering Now
              </Link>
              <Link
                href="#how-it-works"
                className="inline-block px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-lg text-center"
              >
                Learn More
              </Link>
            </div>
            <div className="flex gap-8 pt-8">
              <div>
                <p className="text-3xl font-bold text-green-600">24/7</p>
                <p className="text-gray-600">Customer Support</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">2-3 Days</p>
                <p className="text-gray-600">Fast Delivery</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">1000+</p>
                <p className="text-gray-600">Medications Available</p>
              </div>
            </div>
          </div>
          <div className="relative h-96 lg:h-full min-h-96 rounded-xl overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1576091160550-112173f7f869?w=600&h=600&fit=crop"
              alt="Pharmacist with medications"
              fill
              className="object-cover"
            />
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
                All our pharmacists are fully licensed, verified, and available to answer your medication questions anytime.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Fast Delivery
              </h3>
              <p className="text-gray-600">
                Most prescriptions delivered within 2-3 days. Over-the-counter medications ready to ship immediately.
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
                Competitive prices on prescriptions and OTC medications with transparent billing and insurance integration.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Patient Care First
              </h3>
              <p className="text-gray-600">
                Secure, confidential service with 24/7 customer support dedicated to your health and wellness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prescriptions Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Prescription Medications Made Easy
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Stop waiting in long pharmacy lines. RoyaltyMeds brings prescription convenience directly to your home. Upload your prescription from your doctor and let our licensed pharmacists handle the rest.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Licensed pharmacist review</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Secure prescription handling</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Direct shipment to your door</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Insurance integration available</span>
                </li>
              </ul>
              <Link
                href="/store"
                className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Order Prescriptions Now
              </Link>
            </div>
            <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=600&h=600&fit=crop"
                alt="Prescription medications"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* OTC Medications Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-xl overflow-hidden shadow-lg order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1585435557106-eef5fc0b51df?w=600&h=600&fit=crop"
                alt="Over-the-counter medications"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Over-The-Counter Medications & Wellness
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Browse our extensive selection of OTC medications, vitamins, supplements, and wellness products. From pain relief to cold medicine, allergy medication to digestive aids, we have everything you need for your family's health.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">1000+ OTC products in stock</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Competitive pricing on all items</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Expert product recommendations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Same-day processing available</span>
                </li>
              </ul>
              <Link
                href="/store"
                className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Shop OTC Medications
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Simple 4-Step Process
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
                Sign up in minutes with your personal information and medical history. Your data is secure and encrypted.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload or Order
              </h3>
              <p className="text-gray-600">
                Submit your prescription via upload or order OTC medications directly from our store. Easy and hassle-free.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Pharmacist Review
              </h3>
              <p className="text-gray-600">
                Our licensed pharmacists review your prescription and contact you if needed. Professional care every step.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Fast Delivery
              </h3>
              <p className="text-gray-600">
                Your medications are carefully prepared and delivered within 2-3 days. Track your order anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pharmacist Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=600&fit=crop"
                alt="Professional pharmacist"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Professional Pharmacist Care
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Every prescription is reviewed by our team of licensed, experienced pharmacists. We're not just filling orders—we're providing professional healthcare guidance to ensure your medications are right for you.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Medication interaction checks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Dosage verification</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Allergy and side effect counseling</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Available for questions 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Customers Choose RoyaltyMeds
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              "Prescription uploads with automatic tracking",
              "Secure, HIPAA-compliant platform",
              "Expert pharmacist consultations available",
              "Automatic refill reminders so you never run out",
              "Multiple payment and insurance options",
              "Discreet and confidential service",
              "Fast, reliable 2-3 day delivery",
              "Browse and order 1000+ OTC products anytime",
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Get Your Medications Delivered?
          </h2>
          <p className="text-lg text-green-50 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust RoyaltyMeds for convenient, professional prescription and OTC medication delivery.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/store"
              className="inline-block px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
            >
              Start Ordering Now
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition font-semibold text-lg"
            >
              Login to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="text-center">
              <span className="text-xl font-bold text-white">
                <span className="text-green-400">R</span>oyaltyMeds
              </span>
              <p className="text-sm text-gray-400 mt-2">
                Your trusted online pharmacy for prescriptions and OTC medications.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center">
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
                  <Link href="/store" className="hover:text-green-400 transition">
                    Store
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm flex flex-col items-center">
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
                  <span>1-800-ROYALTY</span>
                </li>
                <li className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>24/7 Available</span>
                </li>
              </ul>
            </div>

            {/* Pharmacist Access */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-4">For Pharmacists</h4>
              <Link
                href="/admin-login"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
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

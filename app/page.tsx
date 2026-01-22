import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  Heart,
  Truck,
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
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <Image
                src="/royaltymeds_logo.jpeg"
                alt="RoyaltyMeds Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg sm:text-2xl font-bold text-gray-900">
              <span className="text-green-600">R</span>oyaltyMeds
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="#features"
              className="hidden md:block text-gray-700 hover:text-green-600 transition text-sm"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden md:block text-gray-700 hover:text-green-600 transition text-sm"
            >
              How It Works
            </a>
            <Link
              href="/store"
              className="px-3 sm:px-6 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-base"
            >
              Start Ordering
            </Link>
            <Link
              href="/login"
              className="px-3 sm:px-6 py-1.5 sm:py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-xs sm:text-base"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24 flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Your Trusted Online{" "}
              <span className="text-green-600">Pharmacy</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">
              Fast, affordable prescription and over-the-counter medication delivery with licensed pharmacists available to answer your questions. Get your medications delivered right to your door.
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              <Link
                href="/store"
                className="w-full px-4 sm:px-8 py-2.5 sm:py-3 lg:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm sm:text-base lg:text-lg text-center"
              >
                Start Ordering Now
              </Link>
              <Link
                href="#how-it-works"
                className="w-full px-4 sm:px-8 py-2.5 sm:py-3 lg:py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-sm sm:text-base lg:text-lg text-center"
              >
                Learn More
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 lg:pt-8">
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">24/7</p>
                <p className="text-xs sm:text-sm text-gray-600">Customer Support</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">1Hr - 24Hr</p>
                <p className="text-xs sm:text-sm text-gray-600">Fast Delivery</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">1000+</p>
                <p className="text-xs sm:text-sm text-gray-600">Medications Available</p>
              </div>
            </div>
          </div>
          <div className="block relative rounded-xl overflow-hidden shadow-2xl">
            <Image
              src="/homepage_pics/royaltymeds_pharmacist2.jpeg"
              alt="Pharmacist with medications"
              width={600}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Why Choose RoyaltyMeds?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Licensed Pharmacists
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Our pharmacists are licensed, verified, and available to answer your medication questions whenever you need expert guidance.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Fast Delivery
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Delivered within 1 hour in Kingston and 12-24 hours outside Kingston. Over-the-counter medications ready to ship immediately.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <CreditCardIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Affordable Pricing
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Competitive prices on prescriptions and OTC medications with transparent billing and insurance integration.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Patient Care First
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Secure, confidential service with 24/7 customer support dedicated to your health and wellness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prescriptions Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Prescription Medications Made Easy
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
                Everything you need for everyday health - pain relief, cold and allergy care, vitamins, supplements, and more - delivered with RoyaltyMeds convenience.
              </p>
              <ul className="space-y-3 mb-6 sm:mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Licensed pharmacist review</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Secure prescription handling</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Direct shipment to your door</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Insurance integration available</span>
                </li>
              </ul>
              <Link
                href="/patient/home"
                className="w-full sm:w-auto block px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm sm:text-base text-center"
              >
                Order Prescription Medications
              </Link>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                You will need to login or create an account to place an order.
              </p>
            </div>
            <div className="hidden lg:block relative rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/homepage_pics/pharmacy_medications.jpg"
                alt="Prescription medications"
                width={600}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* OTC Medications Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="hidden lg:block relative rounded-xl overflow-hidden shadow-lg order-2 lg:order-1">
              <Image
                src="/homepage_pics/pharmacy_isle.jpeg"
                alt="Over-the-counter medications"
                width={600}
                height={600}
                className="w-full h-auto"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Over-The-Counter Medications & Wellness
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
                shop a wide selection of over-the-counter medications, vitamins, supplements, and wellness products online with RoyaltyMeds. We carry trusted OTC medicines for pain relief, cold and flu, allergy relief, digestive health and immune support. From daily vitamins and supplemnents to essential wellness products for the whole family, RoyaltyMeds makes it easy to find what you need - quickly and conveniently.

                Order your OTC medications and wellness essentials online and enjoy reliable service, trusted products, and hassle-free delivery.
              </p>
              <ul className="space-y-3 mb-6 sm:mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">1000+ OTC products in stock</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Competitive pricing on all items</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Expert product recommendations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Same-day processing available</span>
                </li>
              </ul>
              <Link
                href="/store"
                className="w-full sm:w-auto block px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm sm:text-base text-center"
              >
                Shop OTC Medications
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Simple 4-Step Process
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white font-bold text-xl sm:text-2xl">
                1
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Create Account
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Sign up in minutes with your personal information and medical history. Your data is secure and encrypted.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white font-bold text-xl sm:text-2xl">
                2
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Upload or Order
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Submit your prescription via upload or order OTC medications directly from our store. Easy and hassle-free.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white font-bold text-xl sm:text-2xl">
                3
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Pharmacist Review
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Our licensed pharmacists review your prescription and contact you if needed. Professional care every step.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white font-bold text-xl sm:text-2xl">
                4
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Fast Delivery
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Your medications are carefully prepared and delivered within 1 hour in Kingston and 12-24 hours outside Kingston. Track your order anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pharmacist Section */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Professional Pharmacist Care
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
                Every prescription is reviewed by our team of licensed, experienced pharmacists. We&apos;re not just filling orders—we&apos;re providing professional healthcare guidance to ensure your medications are right for you.
              </p>
              <ul className="space-y-3 mb-6 sm:mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Medication interaction checks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Dosage verification</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Allergy and side effect counseling</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">Available for questions 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Why Customers Choose RoyaltyMeds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
            {[
              "Prescription uploads with automatic tracking",
              "Secure, HIPAA-compliant platform",
              "Expert pharmacist consultations available",
              "Automatic refill reminders so you never run out",
              "Multiple payment and insurance options",
              "Discreet and confidential service",
              "same day delivery",
              "Browse and order 1000+ OTC products anytime",
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3 sm:gap-4">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-1" />
                <p className="text-sm sm:text-base lg:text-lg text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Ready to Get Your Medications Delivered?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-green-50 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust RoyaltyMeds for convenient, professional prescription and OTC medication delivery.
          </p>
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:justify-center items-center">
            <Link
              href="/store"
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 lg:py-4 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-semibold text-sm sm:text-base lg:text-lg text-center"
            >
              Start Ordering Now
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 lg:py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition font-semibold text-sm sm:text-base lg:text-lg text-center"
            >
              Login to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Brand */}
            <div className="text-center">
              <span className="text-lg sm:text-xl font-bold text-white">
                <span className="text-green-400">R</span>oyaltyMeds
              </span>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Your trusted online pharmacy for prescriptions and OTC medications.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
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

            {/* Contact */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Contact Us</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm flex flex-col items-center">
                <li className="flex items-center gap-2">
                  <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs">Shop #8, 2 Auburn Terrace, Daytona Dr, Jamaica</span>
                </li>
                <li className="flex items-center gap-2 mt-2">
                  <PhoneIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <a href="tel:+18765723720" className="hover:text-green-400 transition text-xs">
                    +1 876-572-3720
                  </a>
                </li>
                <li className="flex items-center gap-2 mt-2">
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs">24/7 Available</span>
                </li>
              </ul>
            </div>

            {/* Pharmacist Access */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">For Pharmacists</h4>
              <Link
                href="/admin-login"
                className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-sm"
              >
                Pharmacist Portal
              </Link>
              <p className="text-xs text-gray-400 mt-3 sm:mt-4">
                Licensed pharmacists only
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
            <p>
              &copy; 2026 RoyaltyMeds. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 text-xs">
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

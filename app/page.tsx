export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-r from-blue-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          RoyaltyMeds Prescription Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Phase 1: Project Setup & Architecture - Complete ✓
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">✓ Next.js 15 Setup</h2>
            <p className="text-gray-600">
              TypeScript, App Router, and Tailwind CSS configured
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">✓ Supabase Integration</h2>
            <p className="text-gray-600">
              Database client and authentication ready
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">✓ Architecture</h2>
            <p className="text-gray-600">
              Folder structure for auth, admin, patient, and doctor routes
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">✓ Dependencies</h2>
            <p className="text-gray-600">
              Sonner, Framer Motion, and UI components installed
            </p>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Run: <code className="bg-gray-200 px-2 py-1 rounded">npm install</code></li>
            <li>Run migration to setup Supabase schema</li>
            <li>Start development: <code className="bg-gray-200 px-2 py-1 rounded">npm run dev</code></li>
            <li>Begin Phase 2: Authentication & User Management</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

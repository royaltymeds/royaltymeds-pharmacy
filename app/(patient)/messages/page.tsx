import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react";

export default async function MessagesPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch messages for patient
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-rose-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/patient/home"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Communication with pharmacy and support team</p>
        </div>

        {/* Messages List */}
        {messages && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message: any) => (
              <div key={message.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {message.sender_id === user.id ? "You" : "Pharmacy Support"}
                    </p>
                    <p className="text-gray-700 mt-2">{message.message_text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                  {message.sender_id === user.id && (
                    <span className="text-xs font-medium text-blue-600 ml-4">Sent</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MessageSquareIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-600">
              Messages between you and the pharmacy will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

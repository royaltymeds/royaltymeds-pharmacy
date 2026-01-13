import { createServerSupabaseClient, getUser } from "@/lib/supabase-server";
import { MessageSquareIcon } from "lucide-react";

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();

  // Use the utility function to ensure consistent auth context
  const user = await getUser();

  if (!user) {
    // If we can't get user, render a minimal page with error message
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Unable to load messages. Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch messages for patient
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Communication with pharmacy and support team</p>
      </div>

      {/* Messages List */}
      {messages && messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((message: any) => (
            <div key={message.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition border-t-4 border-green-500">
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
                  <span className="text-xs font-medium text-green-600 ml-4">Sent</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageSquareIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Messages Yet</h3>
          <p className="text-gray-600">
            Messages between you and the pharmacy will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

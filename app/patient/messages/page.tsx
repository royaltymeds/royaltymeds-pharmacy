import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { MessageSquareIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  created_at: string;
}

async function getMessages(userId: string): Promise<{ messages: Message[]; currentUserId: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: true });
    return { messages: data || [], currentUserId: userId };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { messages: [], currentUserId: userId };
  }
}

export default async function MessagesPage() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch messages
  const { messages, currentUserId } = await getMessages(user.id);

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
                    {message.sender_id === currentUserId ? "You" : "Pharmacy Support"}
                  </p>
                  <p className="text-gray-700 mt-2">{message.message_text}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                {message.sender_id === currentUserId && (
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

"use client";

import { useState, useEffect } from "react";
import { MessageSquareIcon, Loader } from "lucide-react";

export default function MessagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch("/api/patient/messages");
        
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        setMessages(data.messages || []);

        // Get current user ID for comparison
        const { data: { user } } = await fetch("/api/auth/user").then((r) => r.json());
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadMessages();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading your messages...</p>
        </div>
      </div>
    );
  }

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

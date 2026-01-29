'use client';

import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_email?: string;
  message_text: string;
  created_at: string;
}

interface Conversation {
  id: string;
  subject: string;
  admin_name?: string;
  admin_email?: string;
}

export default function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversation();
    // Set up polling for new messages
    const interval = setInterval(loadConversation, 3000);
    return () => clearInterval(interval);
  }, [params]);

  const loadConversation = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const { id } = await params;

      // Load conversation details
      const convResponse = await fetch(`/api/patient/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!convResponse.ok) throw new Error('Failed to load conversation');
      const convData = await convResponse.json();
      setConversation(convData.conversation);

      // Load messages
      const messResponse = await fetch(`/api/patient/messages/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!messResponse.ok) throw new Error('Failed to load messages');
      const messData = await messResponse.json();
      setMessages(messData.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const { id } = await params;

      const response = await fetch(`/api/patient/messages/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message_text: messageText,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setMessageText('');
      await loadConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading && !conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link href="/patient/messages" className="mt-4 text-green-600 hover:text-green-700">
            ← Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/patient/messages" className="text-green-600 hover:text-green-700 text-sm font-medium mb-4 inline-block">
            ← Back to Messages
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{conversation?.subject}</h1>
          <p className="text-gray-600 text-sm mt-1">
            With {conversation?.admin_name || conversation?.admin_email || 'Pharmacy Team'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map(message => {
              const isFromPatient = !message.sender_email?.includes('@royaltymedspharmacy.com');
              return (
                <div
                  key={message.id}
                  className={`flex ${isFromPatient ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isFromPatient
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.message_text}</p>
                    <p className={`text-xs mt-1 ${isFromPatient ? 'text-green-100' : 'text-gray-600'}`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

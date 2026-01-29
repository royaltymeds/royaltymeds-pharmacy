'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface Conversation {
  id: string;
  patient_id: string;
  admin_id: string;
  admin_name?: string;
  admin_email?: string;
  subject: string;
  last_message_at: string;
  created_at: string;
  unread_count?: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadConversations();
  }, [filter]);

  const loadConversations = async () => {
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

      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('unread_only', 'true');
      }

      const response = await fetch(`/api/patient/messages?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">View and respond to messages from our pharmacy team</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                filter === f
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">
              {filter === 'unread' ? 'No unread messages' : 'No conversations yet'}
            </p>
            <p className="text-sm text-gray-400">
              You can contact the pharmacy team through your prescription or order pages
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conversation => (
              <Link
                key={conversation.id}
                href={`/patient/messages/${conversation.id}`}
                className="block bg-white rounded-lg shadow p-4 hover:shadow-md hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{conversation.subject}</h3>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      With {conversation.admin_name || conversation.admin_email || 'Pharmacy Team'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Last message {new Date(conversation.last_message_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-600">
                        {new Date(conversation.last_message_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

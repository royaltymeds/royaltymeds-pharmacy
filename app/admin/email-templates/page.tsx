'use client';

import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: 'order_confirmation' | 'order_shipped' | 'refill_approved' | 'refill_rejected' | 'password_reset' | 'custom';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    template_type: 'custom' as EmailTemplate['template_type'],
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadTemplates = useCallback(async () => {
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

      const response = await fetch('/api/admin/email-templates', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSave = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const method = isEditing && selectedTemplate ? 'PUT' : 'POST';
      const url = isEditing && selectedTemplate ? `/api/admin/email-templates/${selectedTemplate.id}` : '/api/admin/email-templates';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save template');

      await loadTemplates();
      setIsEditing(false);
      setIsCreating(false);
      setFormData({ name: '', subject: '', body: '', template_type: 'custom' });
      setSelectedTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete template');

      await loadTemplates();
      setSelectedTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    const colors: { [key: string]: string } = {
      order_confirmation: 'bg-blue-100 text-blue-800',
      order_shipped: 'bg-purple-100 text-purple-800',
      refill_approved: 'bg-green-100 text-green-800',
      refill_rejected: 'bg-red-100 text-red-800',
      password_reset: 'bg-orange-100 text-orange-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return `${baseClasses} ${colors[type] || colors.custom}`;
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
            <p className="text-gray-600">Manage system email templates</p>
          </div>
          <button
            onClick={() => {
              setIsCreating(true);
              setFormData({ name: '', subject: '', body: '', template_type: 'custom' });
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            New Template
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-2">
            {templates.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No email templates created yet</p>
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setFormData({ name: '', subject: '', body: '', template_type: 'custom' });
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Create your first template →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditing(false);
                    }}
                    className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition ${
                      selectedTemplate?.id === template.id
                        ? 'border-green-500'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                      </div>
                      <div className="ml-4">
                        <span className={getTypeBadge(template.template_type)}>
                          {template.template_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      {template.is_active && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
                      )}
                      <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Detail/Editor */}
          <div className="lg:col-span-1">
            {isCreating || (isEditing && selectedTemplate) ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4">
                  {isEditing ? 'Edit Template' : 'Create Template'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Template name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.template_type}
                      onChange={e => setFormData({ ...formData, template_type: e.target.value as EmailTemplate['template_type'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="custom">Custom</option>
                      <option value="order_confirmation">Order Confirmation</option>
                      <option value="order_shipped">Order Shipped</option>
                      <option value="refill_approved">Refill Approved</option>
                      <option value="refill_rejected">Refill Rejected</option>
                      <option value="password_reset">Password Reset</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Email subject"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={e => setFormData({ ...formData, body: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Email body (HTML supported)"
                      rows={8}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setFormData({ name: '', subject: '', body: '', template_type: 'custom' });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedTemplate ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4">Template Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-medium">Name</p>
                    <p className="text-gray-900 mt-1">{selectedTemplate.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-medium">Type</p>
                    <span className={`${getTypeBadge(selectedTemplate.template_type)} inline-block mt-1`}>
                      {selectedTemplate.template_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-medium">Subject</p>
                    <p className="text-gray-900 mt-1 text-sm">{selectedTemplate.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-medium">Body</p>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-1 text-sm text-gray-900 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {selectedTemplate.body}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setFormData({
                          name: selectedTemplate.name,
                          subject: selectedTemplate.subject,
                          body: selectedTemplate.body,
                          template_type: selectedTemplate.template_type,
                        });
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTemplate.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Select a template to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

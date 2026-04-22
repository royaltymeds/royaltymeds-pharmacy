'use client';

import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/app/actions/restock';
import { Supplier, CreateSupplierInput } from '@/lib/types/restock';
import { Plus, Edit2, Trash2, AlertCircle, Loader, X } from 'lucide-react';

export function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateSupplierInput>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    payment_terms: '',
    lead_time_days: 3,
    minimum_order_amount: 0,
    notes: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data } = await getSuppliers();
    if (data) {
      setSuppliers(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      payment_terms: '',
      lead_time_days: 3,
      minimum_order_amount: 0,
      notes: '',
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      payment_terms: supplier.payment_terms || '',
      lead_time_days: supplier.lead_time_days,
      minimum_order_amount: supplier.minimum_order_amount,
      notes: supplier.notes || '',
    });
    setEditingId(supplier.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);

    try {
      if (editingId) {
        const { error } = await updateSupplier(editingId, formData);
        if (error) {
          setError(error);
          setActionLoading(false);
          return;
        }
      } else {
        const { error } = await createSupplier(formData);
        if (error) {
          setError(error);
          setActionLoading(false);
          return;
        }
      }

      setShowModal(false);
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier');
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    setActionLoading(true);
    const { error } = await deleteSupplier(id);

    if (error) {
      setError(error);
    } else {
      await loadSuppliers();
    }
    setActionLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Suppliers</h2>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="px-6 py-12 text-center">
          <Loader className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500 font-medium mb-4">No suppliers added yet</p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add First Supplier
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{supplier.contact_person}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(supplier)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">{supplier.email || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-gray-900 font-medium">{supplier.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lead Time</p>
                  <p className="text-gray-900 font-medium">{supplier.lead_time_days} days</p>
                </div>
                <div>
                  <p className="text-gray-500">Min Order</p>
                  <p className="text-gray-900 font-medium">${Number(supplier.minimum_order_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="e.g., Net 30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) =>
                      setFormData({ ...formData, lead_time_days: parseInt(e.target.value) })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_order_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, minimum_order_amount: parseFloat(e.target.value) })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={actionLoading || !formData.name}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update Supplier' : 'Create Supplier'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

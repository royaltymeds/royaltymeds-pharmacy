'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRestockRequest, getSuppliers, getSupplierProducts } from '@/app/actions/restock';
import { getOTCDrugs, getPrescriptionDrugs } from '@/app/actions/inventory';
import { Supplier, SupplierProduct } from '@/lib/types/restock';
import { OTCDrug, PrescriptionDrug } from '@/lib/types/inventory';
import { X, Plus, Loader, AlertCircle } from 'lucide-react';

interface RestockItem {
  supplier_product_id: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name: string;
  quantity_requested: number;
  unit_price: number;
  temporary_id?: string;
}

interface NewRestockRequestFormProps {
  pharmacistId: string;
}

export function NewRestockRequestForm({ pharmacistId }: NewRestockRequestFormProps) {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [items, setItems] = useState<RestockItem[]>([]);
  const [otcDrugs, setOTCDrugs] = useState<OTCDrug[]>([]);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState<PrescriptionDrug[]>([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadSuppliers = useCallback(async () => {
    const { data } = await getSuppliers();
    if (data) {
      setSuppliers(data);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();

    const loadInventoryItems = async () => {
      try {
        const [otc, prescription] = await Promise.all([getOTCDrugs(), getPrescriptionDrugs()]);
        setOTCDrugs(otc);
        setPrescriptionDrugs(prescription);
      } catch (err) {
        console.error('Failed to load inventory items for restock form', err);
      }
    };

    loadInventoryItems();
  }, [loadSuppliers]);

  const loadSupplierProducts = useCallback(async () => {
    if (!selectedSupplier) return;
    const { data } = await getSupplierProducts(selectedSupplier.id);
    if (data) {
      setSupplierProducts(data);
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierProducts();
    }
  }, [selectedSupplier, loadSupplierProducts]);


  const getProductName = (product: SupplierProduct) => {
    if (product.product_name) return product.product_name;
    const catalog = product.product_type === 'otc' ? otcDrugs : prescriptionDrugs;
    return catalog.find((item) => item.id === product.product_id)?.name || product.product_id;
  };

  const addItem = (product: SupplierProduct) => {
    const newItem: RestockItem = {
      supplier_product_id: product.id,
      product_id: product.product_id,
      product_type: product.product_type,
      product_name: getProductName(product),
      quantity_requested: product.minimum_order_quantity || 1,
      unit_price: product.supplier_unit_price,
      temporary_id: Math.random().toString(36).substr(2, 9),
    };

    // Check if already added
    if (!items.find((i) => i.supplier_product_id === product.id)) {
      setItems([...items, newItem]);
    }
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter((i) => i.temporary_id !== tempId));
  };

  const updateItemQuantity = (tempId: string, quantity: number) => {
    setItems(
      items.map((i) => (i.temporary_id === tempId ? { ...i, quantity_requested: quantity } : i))
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity_requested * item.unit_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSupplier) {
      setError('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setLoading(true);

    try {
      const { data, error: submitError } = await createRestockRequest(pharmacistId, {
        supplier_id: selectedSupplier.id,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_type: item.product_type,
          product_name: item.product_name,
          quantity_requested: item.quantity_requested,
          unit_price: item.unit_price,
        })),
        expected_delivery_date: expectedDeliveryDate || undefined,
      });

      if (submitError) {
        setError(submitError);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/admin/restock/${data?.id}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create restock request');
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 font-medium">Restock order created successfully!</p>
        </div>
      )}

      {/* Card: Select Supplier */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Supplier</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
              Supplier *
            </label>
            <select
              id="supplier"
              value={selectedSupplier?.id || ''}
              onChange={(e) => {
                const supplier = suppliers.find((s) => s.id === e.target.value);
                setSelectedSupplier(supplier || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">-- Choose a supplier --</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                  {supplier.lead_time_days && ` (${supplier.lead_time_days} days)`}
                </option>
              ))}
            </select>
          </div>

          {selectedSupplier && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Contact</p>
                <p className="text-sm font-medium text-gray-900">{selectedSupplier.contact_person}</p>
                <p className="text-xs text-gray-600">{selectedSupplier.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lead Time</p>
                <p className="text-sm font-medium text-gray-900">{selectedSupplier.lead_time_days} days</p>
                <p className="text-xs text-gray-600">Min Order: ${selectedSupplier.minimum_order_amount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card: Select Items */}
      {selectedSupplier && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Items</h2>

          {supplierProducts.length === 0 ? (
            <p className="text-gray-500">No products available for this supplier</p>
          ) : (
            <div className="space-y-2">
              {supplierProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getProductName(product)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {product.supplier_sku ? `SKU: ${product.supplier_sku} | ` : ''}
                      Min Order: {product.minimum_order_quantity} | Price: ${Number(product.supplier_unit_price).toFixed(2)}/unit
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    disabled={items.some((i) => i.supplier_product_id === product.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card: Order Items */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.temporary_id} className="flex items-end gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                  <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                </div>

                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity_requested}
                    onChange={(e) => updateItemQuantity(item.temporary_id!, parseInt(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                  <p className="text-sm font-medium text-gray-900">${Number(item.unit_price).toFixed(2)}</p>
                </div>

                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                  <p className="text-sm font-semibold text-gray-900">
                    ${(item.quantity_requested * item.unit_price).toFixed(2)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.temporary_id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-end gap-8">
              <div>
                <p className="text-sm text-gray-600">Subtotal:</p>
                <p className="text-lg font-semibold text-gray-900">${total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card: Additional Details */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>

          <div>
            <label htmlFor="delivery" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date
            </label>
            <input
              id="delivery"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-6">
        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          Submit Restock Order
        </button>
        <Link
          href="/admin/restock"
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

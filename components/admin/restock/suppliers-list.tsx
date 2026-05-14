'use client';

import { useState, useEffect } from 'react';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  createSupplierProduct,
  createSupplierProductsBulk,
  deleteSupplierProduct,
} from '@/app/actions/restock';
import { getOTCDrugs, getPrescriptionDrugs } from '@/app/actions/inventory';
import { Supplier, CreateSupplierInput, CreateSupplierProductInput, SupplierProduct } from '@/lib/types/restock';
import { OTCDrug, PrescriptionDrug } from '@/lib/types/inventory';
import { Plus, Edit2, Trash2, AlertCircle, Loader, X, Link2, Pill } from 'lucide-react';

export function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProductsMap, setSupplierProductsMap] = useState<Record<string, SupplierProduct[]>>({});
  const [otcDrugs, setOTCDrugs] = useState<OTCDrug[]>([]);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState<PrescriptionDrug[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedSupplierForProduct, setSelectedSupplierForProduct] = useState<Supplier | null>(null);
  const [productSource, setProductSource] = useState<'inventory' | 'non_inventory'>('inventory');
  const [showItemSupplierModal, setShowItemSupplierModal] = useState(false);
  const [selectedSupplierIdsForItem, setSelectedSupplierIdsForItem] = useState<string[]>([]);
  const [samePriceForSelectedSuppliers, setSamePriceForSelectedSuppliers] = useState(true);
  const [supplierPriceOverrides, setSupplierPriceOverrides] = useState<Record<string, number>>({});
  const [itemSupplierFormData, setItemSupplierFormData] = useState<CreateSupplierProductInput>({
    supplier_id: '',
    product_id: '',
    product_type: 'otc',
    product_name: '',
    is_inventory_item: true,
    supplier_sku: '',
    supplier_unit_price: 0,
    minimum_order_quantity: 1,
    notes: '',
  });

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
    reorder_schedule_type: '',
    reorder_schedule_start_date: '',
    reorder_schedule_custom_dates: [],
    reorder_schedule_is_recurring: false,
    reorder_schedule_notes: '',
    notes: '',
  });

  const [productFormData, setProductFormData] = useState<CreateSupplierProductInput>({
    supplier_id: '',
    product_id: '',
    product_type: 'otc',
    product_name: '',
    is_inventory_item: true,
    supplier_sku: '',
    supplier_unit_price: 0,
    minimum_order_quantity: 1,
    notes: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const getProductOptions = (productType: 'otc' | 'prescription') => {
    return productType === 'otc' ? otcDrugs : prescriptionDrugs;
  };

  const getProductDescription = (productId: string, productType: 'otc' | 'prescription') => {
    const products = getProductOptions(productType);
    return products.find((product) => product.id === productId)?.description || '';
  };

  const resolveProductName = (productId: string, productType: 'otc' | 'prescription') => {
    const products = getProductOptions(productType);
    return products.find((product) => product.id === productId)?.name || productId;
  };

  const loadSupplierProductsForSupplier = async (supplierId: string) => {
    const { data } = await getSupplierProducts(supplierId);
    if (!data) return;

    const enrichedProducts = data.map((product) => ({
      ...product,
      product_name: product.product_name || resolveProductName(product.product_id, product.product_type),
    }));

    setSupplierProductsMap((prev) => ({
      ...prev,
      [supplierId]: enrichedProducts,
    }));
  };

  const loadInitialData = async () => {
    setLoading(true);

    try {
      const [suppliersResponse, otc, prescription] = await Promise.all([
        getSuppliers(),
        getOTCDrugs(),
        getPrescriptionDrugs(),
      ]);

      setOTCDrugs(otc);
      setPrescriptionDrugs(prescription);

      if (suppliersResponse.data) {
        setSuppliers(suppliersResponse.data);

        const supplierProductsResults = await Promise.all(
          suppliersResponse.data.map(async (supplier) => {
            const { data } = await getSupplierProducts(supplier.id);
            return {
              supplierId: supplier.id,
              products:
                data?.map((product) => ({
                  ...product,
                  product_name: product.product_name ||
                    (product.product_type === 'otc' ? otc : prescription).find((item) => item.id === product.product_id)
                      ?.name || product.product_id,
                })) || [],
            };
          })
        );

        const productsMap: Record<string, SupplierProduct[]> = {};
        supplierProductsResults.forEach(({ supplierId, products }) => {
          productsMap[supplierId] = products;
        });

        setSupplierProductsMap(productsMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load supplier data');
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
      reorder_schedule_type: '',
      reorder_schedule_start_date: '',
      reorder_schedule_custom_dates: [],
      reorder_schedule_is_recurring: false,
      reorder_schedule_notes: '',
      notes: '',
    });
    setEditingId(null);
  };

  const resetProductForm = () => {
    setProductFormData({
      supplier_id: selectedSupplierForProduct?.id || '',
      product_id: '',
      product_type: 'otc',
      product_name: '',
      is_inventory_item: true,
      supplier_sku: '',
      supplier_unit_price: 0,
      minimum_order_quantity: 1,
      notes: '',
    });
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
      reorder_schedule_type: supplier.reorder_schedule_type || '',
      reorder_schedule_start_date: supplier.reorder_schedule_start_date || '',
      reorder_schedule_custom_dates: supplier.reorder_schedule_custom_dates || [],
      reorder_schedule_is_recurring: supplier.reorder_schedule_is_recurring || false,
      reorder_schedule_notes: supplier.reorder_schedule_notes || '',
      notes: supplier.notes || '',
    });
    setEditingId(supplier.id);
    setShowModal(true);
  };

  const handleOpenProductModal = (supplier: Supplier) => {
    setSelectedSupplierForProduct(supplier);
    setProductSource('inventory');
    setShowProductModal(true);
    setProductFormData({
      supplier_id: supplier.id,
      product_id: '',
      product_type: 'otc',
      product_name: '',
      is_inventory_item: true,
      supplier_sku: '',
      supplier_unit_price: 0,
      minimum_order_quantity: 1,
      notes: '',
    });
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
      await loadInitialData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier');
    }
    setActionLoading(false);
  };

  const handleSubmitItemSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);

    try {
      const selectedItem = getProductOptions(itemSupplierFormData.product_type).find((item) => item.id === itemSupplierFormData.product_id);
      const supplierIds = selectedSupplierIdsForItem.length > 0 ? selectedSupplierIdsForItem : [itemSupplierFormData.supplier_id].filter(Boolean);
      if (supplierIds.length === 0) {
        setError('Select at least one supplier.');
        setActionLoading(false);
        return;
      }

      const payloads = supplierIds.map((supplierId) => ({
        ...itemSupplierFormData,
        supplier_id: supplierId,
        supplier_unit_price: samePriceForSelectedSuppliers ? itemSupplierFormData.supplier_unit_price : supplierPriceOverrides[supplierId] ?? itemSupplierFormData.supplier_unit_price,
        product_name: selectedItem?.name || itemSupplierFormData.product_name,
        is_inventory_item: true,
      }));

      const { error } = await createSupplierProductsBulk(payloads);

      if (error) {
        setError(error);
        setActionLoading(false);
        return;
      }

      await Promise.all(supplierIds.map((supplierId) => loadSupplierProductsForSupplier(supplierId)));
      setShowItemSupplierModal(false);
      setSelectedSupplierIdsForItem([]);
      setSupplierPriceOverrides({});
      setItemSupplierFormData({
        supplier_id: '',
        product_id: '',
        product_type: 'otc',
        product_name: '',
        is_inventory_item: true,
        supplier_sku: '',
        supplier_unit_price: 0,
        minimum_order_quantity: 1,
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link supplier to item');
    }

    setActionLoading(false);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);

    try {
      const payload: CreateSupplierProductInput = {
        ...productFormData,
        is_inventory_item: productSource === 'inventory',
        product_id: productSource === 'inventory' ? productFormData.product_id : crypto.randomUUID(),
        product_name:
          productSource === 'inventory'
            ? getProductOptions(productFormData.product_type).find((item) => item.id === productFormData.product_id)?.name
            : productFormData.product_name,
      };

      const { error } = await createSupplierProduct(payload);

      if (error) {
        setError(error);
        setActionLoading(false);
        return;
      }

      if (selectedSupplierForProduct) {
        await loadSupplierProductsForSupplier(selectedSupplierForProduct.id);
      }

      setShowProductModal(false);
      setSelectedSupplierForProduct(null);
      resetProductForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link product');
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
      await loadInitialData();
    }
    setActionLoading(false);
  };

  const handleDeleteSupplierProduct = async (supplierId: string, supplierProductId: string) => {
    if (!confirm('Remove this linked item from supplier?')) return;

    setActionLoading(true);

    const { error } = await deleteSupplierProduct(supplierProductId);

    if (error) {
      setError(error);
    } else {
      await loadSupplierProductsForSupplier(supplierId);
    }

    setActionLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">All Suppliers</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
            <button
              onClick={() => setShowItemSupplierModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Link2 className="w-4 h-4" />
              Link Supplier to Item
            </button>
          </div>
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
                    onClick={() => handleOpenProductModal(supplier)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Link item to supplier"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
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

              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                <p className="font-semibold uppercase tracking-wide text-blue-700">Re-order Schedule</p>
                {supplier.reorder_schedule_type ? (
                  <p className="mt-1">
                    {supplier.reorder_schedule_type.replace('_', '-')}
                    {supplier.reorder_schedule_start_date ? ` starting ${new Date(`${supplier.reorder_schedule_start_date}T00:00:00`).toLocaleDateString()}` : ''}
                    {supplier.reorder_schedule_custom_dates?.length ? ` · ${supplier.reorder_schedule_custom_dates.length} custom date(s)` : ''}
                    {supplier.reorder_schedule_is_recurring ? ' · recurring' : ''}
                  </p>
                ) : (
                  <p className="mt-1 text-blue-700">No schedule configured</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Linked Restock Items</p>
                  <button
                    onClick={() => handleOpenProductModal(supplier)}
                    className="text-xs font-medium text-green-700 hover:text-green-800"
                  >
                    + Link Item
                  </button>
                </div>

                {(supplierProductsMap[supplier.id] || []).length === 0 ? (
                  <p className="text-xs text-gray-500">No items linked yet</p>
                ) : (
                  <div className="space-y-2">
                    {(supplierProductsMap[supplier.id] || []).map((product) => (
                      <div key={product.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.product_name || resolveProductName(product.product_id, product.product_type)}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="uppercase">{product.product_type}</span>
                            {' · '}
                            {product.is_inventory_item === false ? 'Non-Inventory' : 'Inventory'}
                            {' · '}
                            Min Qty: {product.minimum_order_quantity}
                            {' · '}
                            ${Number(product.supplier_unit_price).toFixed(2)}
                            {product.supplier_sku ? ` · SKU: ${product.supplier_sku}` : ''}
                            {getProductDescription(product.product_id, product.product_type) ? ` · ${getProductDescription(product.product_id, product.product_type)}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSupplierProduct(supplier.id, product.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Unlink item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Modal */}
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={Number.isNaN(formData.lead_time_days) ? '' : formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value === '' ? Number.NaN : parseInt(e.target.value, 10) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Amount
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={Number.isNaN(formData.minimum_order_amount) ? '' : formData.minimum_order_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div className="col-span-2 border-t border-gray-200 pt-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Supplier Re-order Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
                      <select
                        value={formData.reorder_schedule_type || ''}
                        onChange={(e) => setFormData({ ...formData, reorder_schedule_type: e.target.value as CreateSupplierInput['reorder_schedule_type'] })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                      >
                        <option value="">No schedule</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-weekly (every two weeks)</option>
                        <option value="three_weeks">Every 3 weeks</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom dates</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start / Next Date</label>
                      <input
                        type="date"
                        value={formData.reorder_schedule_start_date || ''}
                        onChange={(e) => setFormData({ ...formData, reorder_schedule_start_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom Dates</label>
                      <input
                        type="text"
                        value={(formData.reorder_schedule_custom_dates || []).join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reorder_schedule_custom_dates: e.target.value
                              .split(',')
                              .map((date) => date.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="YYYY-MM-DD, YYYY-MM-DD"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                      <p className="mt-1 text-xs text-gray-500">Use this for custom schedules. Separate multiple selected dates with commas.</p>
                    </div>

                    <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!formData.reorder_schedule_is_recurring}
                        onChange={(e) => setFormData({ ...formData, reorder_schedule_is_recurring: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-600"
                      />
                      Make custom dates recurring annually
                    </label>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Notes</label>
                      <input
                        type="text"
                        value={formData.reorder_schedule_notes || ''}
                        onChange={(e) => setFormData({ ...formData, reorder_schedule_notes: e.target.value })}
                        placeholder="e.g., Call supplier one week before monthly order"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                  </div>
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
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300"
                >
                  {actionLoading ? 'Saving...' : editingId ? 'Update Supplier' : 'Create Supplier'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Item-first Supplier Link Modal */}
      {showItemSupplierModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                Link Supplier to Item
              </h2>
              <button onClick={() => setShowItemSupplierModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitItemSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type *</label>
                <select
                  value={itemSupplierFormData.product_type}
                  onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, product_type: e.target.value as 'otc' | 'prescription', product_id: '', product_name: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="otc">OTC</option>
                  <option value="prescription">Prescription</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                <select
                  value={itemSupplierFormData.product_id}
                  onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, product_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Choose an item --</option>
                  {getProductOptions(itemSupplierFormData.product_type).map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                {itemSupplierFormData.product_id && (
                  <p className="mt-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                    {getProductDescription(itemSupplierFormData.product_id, itemSupplierFormData.product_type) || 'No item description saved. Use the item name/description to clarify package size when unit cost is per package.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suppliers *</label>
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-300 p-3">
                  {suppliers.map((supplier) => (
                    <label key={supplier.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedSupplierIdsForItem.includes(supplier.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedSupplierIdsForItem((current) => checked ? [...current, supplier.id] : current.filter((id) => id !== supplier.id));
                          setItemSupplierFormData((current) => ({ ...current, supplier_id: checked ? supplier.id : current.supplier_id === supplier.id ? '' : current.supplier_id }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      {supplier.name}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">Select one or more suppliers to bulk-link this item.</p>
              </div>

              {selectedSupplierIdsForItem.length > 1 && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={samePriceForSelectedSuppliers}
                    onChange={(e) => setSamePriceForSelectedSuppliers(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  Use the same unit cost for every selected supplier
                </label>
              )}

              {!samePriceForSelectedSuppliers && selectedSupplierIdsForItem.length > 1 && (
                <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  {selectedSupplierIdsForItem.map((supplierId) => (
                    <label key={supplierId} className="grid grid-cols-2 items-center gap-3 text-sm">
                      <span className="font-medium text-blue-900">{suppliers.find((supplier) => supplier.id === supplierId)?.name}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        value={Number.isNaN(supplierPriceOverrides[supplierId]) ? '' : supplierPriceOverrides[supplierId] ?? itemSupplierFormData.supplier_unit_price}
                        onChange={(e) => setSupplierPriceOverrides({ ...supplierPriceOverrides, [supplierId]: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </label>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier SKU</label>
                  <input
                    type="text"
                    value={itemSupplierFormData.supplier_sku}
                    onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, supplier_sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (usually per package) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={Number.isNaN(itemSupplierFormData.supplier_unit_price) ? '' : itemSupplierFormData.supplier_unit_price}
                    onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, supplier_unit_price: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Quantity</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={Number.isNaN(itemSupplierFormData.minimum_order_quantity) ? '' : itemSupplierFormData.minimum_order_quantity}
                  onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, minimum_order_quantity: e.target.value === '' ? Number.NaN : parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300">
                  {actionLoading ? 'Linking...' : 'Link Supplier'}
                </button>
                <button type="button" onClick={() => setShowItemSupplierModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Product Modal */}
      {showProductModal && selectedSupplierForProduct && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-green-600" />
                Link Item to {selectedSupplierForProduct.name}
              </h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedSupplierForProduct(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Source *</label>
                <select
                  value={productSource}
                  onChange={(e) => {
                    const source = e.target.value as 'inventory' | 'non_inventory';
                    setProductSource(source);
                    setProductFormData({
                      ...productFormData,
                      product_id: '',
                      product_name: '',
                      is_inventory_item: source === 'inventory',
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="inventory">Inventory Item</option>
                  <option value="non_inventory">Non-Inventory Item</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type *</label>
                <select
                  value={productFormData.product_type}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      product_type: e.target.value as 'otc' | 'prescription',
                      product_id: '',
                      product_name: '',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="otc">OTC</option>
                  <option value="prescription">Prescription</option>
                </select>
              </div>

              {productSource === 'inventory' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Item *</label>
                  <select
                    value={productFormData.product_id}
                    onChange={(e) => setProductFormData({ ...productFormData, product_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="">-- Choose an inventory item --</option>
                    {getProductOptions(productFormData.product_type).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {productFormData.product_id && (
                    <p className="mt-2 rounded-lg bg-green-50 p-3 text-xs text-green-800">
                      {getProductDescription(productFormData.product_id, productFormData.product_type) || 'No item description saved. Use item names/descriptions to differentiate package sizes when unit cost is per package.'}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Non-Inventory Item Name *</label>
                  <input
                    type="text"
                    value={productFormData.product_name}
                    onChange={(e) => setProductFormData({ ...productFormData, product_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g., Packaging Labels"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier SKU</label>
                  <input
                    type="text"
                    value={productFormData.supplier_sku}
                    onChange={(e) => setProductFormData({ ...productFormData, supplier_sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (usually per package) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={Number.isNaN(productFormData.supplier_unit_price) ? '' : productFormData.supplier_unit_price}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, supplier_unit_price: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Quantity</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={Number.isNaN(productFormData.minimum_order_quantity) ? '' : productFormData.minimum_order_quantity}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, minimum_order_quantity: e.target.value === '' ? Number.NaN : parseInt(e.target.value, 10) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={productFormData.notes}
                  onChange={(e) => setProductFormData({ ...productFormData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300"
                >
                  {actionLoading ? 'Linking...' : 'Link Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedSupplierForProduct(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
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

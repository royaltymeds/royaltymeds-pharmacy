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
  updateSupplierProduct,
  deleteSupplierProduct,
} from '@/app/actions/restock';
import { getOTCDrugs, getPrescriptionDrugs } from '@/app/actions/inventory';
import { Supplier, CreateSupplierInput, CreateSupplierProductInput, SupplierProduct } from '@/lib/types/restock';
import { OTCDrug, PrescriptionDrug } from '@/lib/types/inventory';
import { Plus, Edit2, Trash2, AlertCircle, Loader, X, Link2, Pill, Upload, ChevronRight, ChevronDown } from 'lucide-react';
import { ConfirmationModal } from './confirmation-modal';

const SUPPLIER_ITEMS_PAGE_SIZE = 20;

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
  const [expandedSupplierIds, setExpandedSupplierIds] = useState<string[]>([]);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState<Supplier | null>(null);
  const [supplierItemsPage, setSupplierItemsPage] = useState(1);
  const [supplierItemsSearch, setSupplierItemsSearch] = useState('');
  const [expandedSupplierProductId, setExpandedSupplierProductId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ title: string; message: string; confirmLabel: string; onConfirm: () => void } | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedSupplierForProduct, setSelectedSupplierForProduct] = useState<Supplier | null>(null);
  const [productSource, setProductSource] = useState<'inventory' | 'non_inventory'>('inventory');
  const [showItemSupplierModal, setShowItemSupplierModal] = useState(false);
  const [showBulkItemSupplierModal, setShowBulkItemSupplierModal] = useState(false);
  const [selectedSupplierIdsForItem, setSelectedSupplierIdsForItem] = useState<string[]>([]);
  const [samePriceForSelectedSuppliers, setSamePriceForSelectedSuppliers] = useState(true);
  const [itemSupplierSource, setItemSupplierSource] = useState<'inventory' | 'non_inventory'>('inventory');
  const [bulkImportRows, setBulkImportRows] = useState<Record<string, string>[]>([]);
  const [bulkImportColumns, setBulkImportColumns] = useState<string[]>([]);
  const [bulkImportColumnMap, setBulkImportColumnMap] = useState({ productName: '', productType: '', unitPrice: '', supplierSku: '', minimumOrderQuantity: '', notes: '' });
  const [bulkImportInProgress, setBulkImportInProgress] = useState(false);
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

  const toggleSupplierExpanded = (supplierId: string) => {
    setExpandedSupplierIds((current) => current.includes(supplierId) ? current.filter((id) => id !== supplierId) : [...current, supplierId]);
  };

  const handleOpenSupplierDetails = (supplier: Supplier) => {
    setSelectedSupplierDetails(supplier);
    setSupplierItemsPage(1);
    setSupplierItemsSearch('');
    setExpandedSupplierProductId(null);
  };

  const updateSupplierProductDraft = (supplierId: string, productId: string, updates: Partial<SupplierProduct>) => {
    setSupplierProductsMap((current) => ({
      ...current,
      [supplierId]: (current[supplierId] || []).map((product) => product.id === productId ? { ...product, ...updates } : product),
    }));
  };

  const handleSaveSupplierProduct = async (supplierId: string, product: SupplierProduct) => {
    setActionLoading(true);
    setError(null);
    const { error } = await updateSupplierProduct(product.id, {
      product_name: product.product_name,
      supplier_sku: product.supplier_sku,
      supplier_unit_price: product.supplier_unit_price,
      minimum_order_quantity: product.minimum_order_quantity,
      notes: product.notes,
    });
    if (error) {
      setError(error);
    } else {
      await loadSupplierProductsForSupplier(supplierId);
    }
    setActionLoading(false);
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

  const resetItemSupplierState = () => {
    setItemSupplierSource('inventory');
    setBulkImportRows([]);
    setBulkImportColumns([]);
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

  const parseBulkSupplierItems = (text: string) => {
    const delimiter = text.includes('\t') ? '\t' : ',';
    const parseLine = (line: string) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    const headers = parseLine(lines[0] || '');
    const rows = lines.slice(1).map((line) => {
      const values = parseLine(line);
      return headers.reduce<Record<string, string>>((row, header, index) => {
        row[header] = values[index] || '';
        return row;
      }, {});
    });
    const findColumn = (...candidates: string[]) => headers.find((header) => candidates.some((candidate) => header.toLowerCase().includes(candidate))) || '';
    setBulkImportColumns(headers);
    setBulkImportRows(rows);
    setBulkImportColumnMap({
      productName: findColumn('product', 'item', 'name'),
      productType: findColumn('type'),
      unitPrice: findColumn('price', 'cost', 'unit'),
      supplierSku: findColumn('sku'),
      minimumOrderQuantity: findColumn('minimum', 'moq', 'quantity'),
      notes: findColumn('note'),
    });
  };

  const handleBulkSupplierItemImport = async () => {
    setError(null);
    const supplierIds = [itemSupplierFormData.supplier_id].filter(Boolean);
    if (supplierIds.length === 0) {
      setError('Select a supplier before importing items.');
      return;
    }
    if (!bulkImportColumnMap.productName || !bulkImportColumnMap.unitPrice) {
      setError('Map at least Product Name and Unit Cost before importing.');
      return;
    }

    const payloads: CreateSupplierProductInput[] = [];
    for (const row of bulkImportRows) {
      const productName = row[bulkImportColumnMap.productName]?.trim();
      if (!productName) continue;
      const normalizedType = row[bulkImportColumnMap.productType]?.toLowerCase().includes('prescription') ? 'prescription' : itemSupplierFormData.product_type;
      const inventoryMatch = getProductOptions(normalizedType).find((item) => item.name.toLowerCase() === productName.toLowerCase());
      const unitCost = parseFloat(row[bulkImportColumnMap.unitPrice] || '');
      const minimumOrderQuantity = bulkImportColumnMap.minimumOrderQuantity ? parseInt(row[bulkImportColumnMap.minimumOrderQuantity] || '1', 10) : 1;

      for (const supplierId of supplierIds) {
        payloads.push({
          supplier_id: supplierId,
          product_id: inventoryMatch?.id || crypto.randomUUID(),
          product_type: normalizedType,
          product_name: inventoryMatch?.name || productName,
          is_inventory_item: Boolean(inventoryMatch),
          supplier_sku: bulkImportColumnMap.supplierSku ? row[bulkImportColumnMap.supplierSku] : itemSupplierFormData.supplier_sku,
          supplier_unit_price: Number.isFinite(unitCost) ? unitCost : itemSupplierFormData.supplier_unit_price,
          minimum_order_quantity: Number.isFinite(minimumOrderQuantity) && minimumOrderQuantity > 0 ? minimumOrderQuantity : 1,
          notes: bulkImportColumnMap.notes ? row[bulkImportColumnMap.notes] : itemSupplierFormData.notes,
        });
      }
    }

    if (payloads.length === 0) {
      setError('No valid import rows were found.');
      return;
    }

    setActionLoading(true);
    setBulkImportInProgress(true);
    const { error } = await createSupplierProductsBulk(payloads);
    if (error) {
      setError(error);
    } else {
      await Promise.all(supplierIds.map((supplierId) => loadSupplierProductsForSupplier(supplierId)));
      setBulkImportRows([]);
      setBulkImportColumns([]);
      setShowBulkItemSupplierModal(false);
    }
    setBulkImportInProgress(false);
    setActionLoading(false);
  };

  const handleSubmitItemSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);

    try {
      const selectedItem = itemSupplierSource === 'inventory' ? getProductOptions(itemSupplierFormData.product_type).find((item) => item.id === itemSupplierFormData.product_id) : null;
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
        product_id: itemSupplierSource === 'inventory' ? itemSupplierFormData.product_id : crypto.randomUUID(),
        product_name: selectedItem?.name || itemSupplierFormData.product_name,
        is_inventory_item: itemSupplierSource === 'inventory',
      }));

      const { error } = await createSupplierProductsBulk(payloads);

      if (error) {
        setError(error);
        setActionLoading(false);
        return;
      }

      await Promise.all(supplierIds.map((supplierId) => loadSupplierProductsForSupplier(supplierId)));
      setShowItemSupplierModal(false);
      resetItemSupplierState();
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

  const confirmDeleteSupplier = (id: string) => {
    setPendingConfirmation({
      title: 'Delete supplier?',
      message: 'This removes the supplier record from the active supplier list. This action cannot be undone.',
      confirmLabel: 'Delete supplier',
      onConfirm: () => void handleDelete(id),
    });
  };

  const handleDelete = async (id: string) => {
    setPendingConfirmation(null);
    setActionLoading(true);
    const { error } = await deleteSupplier(id);

    if (error) {
      setError(error);
    } else {
      await loadInitialData();
    }
    setActionLoading(false);
  };

  const confirmDeleteSupplierProduct = (supplierId: string, supplierProductId: string) => {
    setPendingConfirmation({
      title: 'Unlink supplier item?',
      message: 'This removes the item from this supplier but does not delete the underlying inventory item.',
      confirmLabel: 'Unlink item',
      onConfirm: () => void handleDeleteSupplierProduct(supplierId, supplierProductId),
    });
  };

  const handleDeleteSupplierProduct = async (supplierId: string, supplierProductId: string) => {
    setPendingConfirmation(null);
    setActionLoading(true);

    const { error } = await deleteSupplierProduct(supplierProductId);

    if (error) {
      setError(error);
    } else {
      await loadSupplierProductsForSupplier(supplierId);
    }

    setActionLoading(false);
  };

  const selectedSupplierProducts = selectedSupplierDetails ? supplierProductsMap[selectedSupplierDetails.id] || [] : [];
  const filteredSelectedSupplierProducts = selectedSupplierProducts.filter((product) => {
    const search = supplierItemsSearch.trim().toLowerCase();
    if (!search) return true;
    return [product.product_name, product.product_id, product.supplier_sku, product.notes, product.product_type]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
  const selectedSupplierItemsTotalPages = Math.max(1, Math.ceil(filteredSelectedSupplierProducts.length / SUPPLIER_ITEMS_PAGE_SIZE));
  const paginatedSelectedSupplierProducts = filteredSelectedSupplierProducts.slice((supplierItemsPage - 1) * SUPPLIER_ITEMS_PAGE_SIZE, supplierItemsPage * SUPPLIER_ITEMS_PAGE_SIZE);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 align-top">All Suppliers</h2>
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
              Link Item to Suppliers
            </button>
            <button
              onClick={() => setShowBulkItemSupplierModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload/Link Items
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
          {suppliers.map((supplier) => {
            const isExpanded = expandedSupplierIds.includes(supplier.id);
            const linkedItemCount = (supplierProductsMap[supplier.id] || []).length;

            return (
              <section key={supplier.id} className="px-6 py-4 transition-colors hover:bg-gray-50">
                <button type="button" onClick={() => toggleSupplierExpanded(supplier.id)} className="flex w-full items-start justify-between gap-3 text-left">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 align-top">{supplier.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{supplier.contact_person || supplier.email || supplier.phone || 'No primary contact'}</p>
                    <p className="mt-2 text-sm text-gray-600">{linkedItemCount} linked item(s) · Lead time {supplier.lead_time_days} days</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                    <dl className="grid gap-3 text-sm md:grid-cols-3">
                      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt><dd className="mt-1 text-gray-900 align-top">{supplier.email || 'Not provided'}</dd></div>
                      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</dt><dd className="mt-1 text-gray-900 align-top">{supplier.phone || 'Not provided'}</dd></div>
                      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Minimum order</dt><dd className="mt-1 text-gray-900 align-top">${Number(supplier.minimum_order_amount).toFixed(2)}</dd></div>
                      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Payment terms</dt><dd className="mt-1 text-gray-900 align-top">{supplier.payment_terms || 'Not provided'}</dd></div>
                      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">City</dt><dd className="mt-1 text-gray-900 align-top">{supplier.city || 'Not provided'}</dd></div>
                      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Address</dt><dd className="mt-1 text-gray-900 align-top">{supplier.address || 'Not provided'}</dd></div>
                    </dl>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
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
                      {supplier.reorder_schedule_notes && <p className="mt-1">{supplier.reorder_schedule_notes}</p>}
                    </div>
                    {supplier.notes && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{supplier.notes}</p>}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleOpenSupplierDetails(supplier)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"><Pill className="h-4 w-4" /> View linked items</button>
                      <button type="button" onClick={() => handleOpenProductModal(supplier)} className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"><Link2 className="h-4 w-4" /> Link item</button>
                      <button type="button" onClick={() => handleOpenEdit(supplier)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Edit2 className="h-4 w-4" /> Edit</button>
                      <button type="button" onClick={() => confirmDeleteSupplier(supplier.id)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}


      {selectedSupplierDetails && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 align-top">{selectedSupplierDetails.name} linked items</h2>
                <p className="text-sm text-gray-600">Page {supplierItemsPage} of {selectedSupplierItemsTotalPages} · {filteredSelectedSupplierProducts.length} shown of {selectedSupplierProducts.length} linked item(s)</p>
              </div>
              <button onClick={() => setSelectedSupplierDetails(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleOpenProductModal(selectedSupplierDetails)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  <Link2 className="h-4 w-4" /> Link Item
                </button>
                <button type="button" onClick={() => handleOpenEdit(selectedSupplierDetails)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  <Edit2 className="h-4 w-4" /> Edit Supplier
                </button>
              </div>
              <input
                type="search"
                value={supplierItemsSearch}
                onChange={(event) => { setSupplierItemsSearch(event.target.value); setSupplierItemsPage(1); setExpandedSupplierProductId(null); }}
                placeholder="Search linked items by name, SKU, type, or notes"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 lg:max-w-sm"
              />
            </div>

            {selectedSupplierProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">No items linked yet.</div>
            ) : filteredSelectedSupplierProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">No linked items match your search.</div>
            ) : (
              <div className="space-y-3">
                {paginatedSelectedSupplierProducts.map((product) => {
                  const isExpanded = expandedSupplierProductId === product.id;

                  return (
                    <div key={product.id} className="rounded-lg border border-gray-200 p-4">
                      <button type="button" onClick={() => setExpandedSupplierProductId(isExpanded ? null : product.id)} className="flex w-full items-center justify-between gap-3 text-left">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 align-top">{product.product_name || product.product_id}</h3>
                          <p className="mt-1 text-xs text-gray-600">
                            <span className="uppercase">{product.product_type}</span> · {product.is_inventory_item === false ? 'Non-Inventory' : 'Inventory'} · SKU {product.supplier_sku || 'not set'} · Unit {Number(product.supplier_unit_price || 0).toFixed(2)} · Min {product.minimum_order_quantity || 1}
                          </p>
                        </div>
                        {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="grid gap-3 md:grid-cols-6">
                            <label className="md:col-span-2 text-xs font-medium uppercase tracking-wide text-gray-500">Item Name
                              <input
                                type="text"
                                value={product.product_name || ''}
                                onChange={(e) => updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { product_name: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
                              />
                            </label>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">SKU
                              <input
                                type="text"
                                value={product.supplier_sku || ''}
                                onChange={(e) => updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { supplier_sku: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
                              />
                            </label>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Unit Cost
                              <input
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9]*[.]?[0-9]*"
                                value={Number.isNaN(product.supplier_unit_price) ? '' : product.supplier_unit_price}
                                onChange={(e) => updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { supplier_unit_price: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
                              />
                            </label>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Min Qty
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={Number.isNaN(product.minimum_order_quantity) ? '' : product.minimum_order_quantity}
                                onChange={(e) => updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { minimum_order_quantity: e.target.value === '' ? Number.NaN : parseInt(e.target.value, 10) })}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
                              />
                            </label>
                            <div className="flex items-end gap-2">
                              <button type="button" onClick={() => handleSaveSupplierProduct(selectedSupplierDetails.id, product)} disabled={actionLoading} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">Save</button>
                              <button type="button" onClick={() => confirmDeleteSupplierProduct(selectedSupplierDetails.id, product.id)} disabled={actionLoading} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:bg-gray-100">Unlink</button>
                            </div>
                          </div>
                          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Notes
                            <textarea
                              value={product.notes || ''}
                              onChange={(e) => updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { notes: e.target.value })}
                              rows={2}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
                            />
                          </label>
                          <p className="mt-2 text-xs text-gray-500">{getProductDescription(product.product_id, product.product_type) || 'No inventory description available.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setSupplierItemsPage((page) => Math.max(1, page - 1))} disabled={supplierItemsPage === 1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span className="text-sm text-gray-600">Showing {paginatedSelectedSupplierProducts.length} item(s), 20 per page</span>
              <button type="button" onClick={() => setSupplierItemsPage((page) => Math.min(selectedSupplierItemsTotalPages, page + 1))} disabled={supplierItemsPage === selectedSupplierItemsTotalPages} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 align-top">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Source *</label>
                  <select value={itemSupplierSource} onChange={(e) => { const source = e.target.value as 'inventory' | 'non_inventory'; setItemSupplierSource(source); setItemSupplierFormData({ ...itemSupplierFormData, is_inventory_item: source === 'inventory', product_id: '', product_name: '' }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-blue-600">
                    <option value="inventory">Inventory Item</option>
                    <option value="non_inventory">Non-Inventory Item</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Type *</label>
                  <select
                    value={itemSupplierFormData.product_type}
                    onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, product_type: e.target.value as 'otc' | 'prescription', product_id: '', product_name: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="otc">OTC</option>
                    <option value="prescription">Prescription</option>
                  </select>
                </div>
              </div>

              {itemSupplierSource === 'inventory' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                  <select
                    value={itemSupplierFormData.product_id}
                    onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, product_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Non-Inventory Item Name *</label>
                  <input type="text" value={itemSupplierFormData.product_name} onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, product_name: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-blue-600" placeholder="e.g., Packaging Labels" />
                </div>
              )}

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
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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

      {showBulkItemSupplierModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Bulk Upload & Link Items
              </h2>
              <button onClick={() => { if (!bulkImportInProgress) setShowBulkItemSupplierModal(false); }} disabled={bulkImportInProgress} className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
                <p className="font-semibold">CSV format requirements</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
                  <li>Keep only the columns you intend to map before uploading.</li>
                  <li>Do not include commas in names or numbers.</li>
                  <li>Use a clean header row with clear column names.</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Item Type</label>
                  <select
                    value={itemSupplierFormData.product_type}
                    onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, product_type: e.target.value as 'otc' | 'prescription' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="otc">OTC</option>
                    <option value="prescription">Prescription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Unit Cost (fallback)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={Number.isNaN(itemSupplierFormData.supplier_unit_price) ? '' : itemSupplierFormData.supplier_unit_price}
                    onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, supplier_unit_price: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <select
                  value={itemSupplierFormData.supplier_id}
                  onChange={(e) => setItemSupplierFormData({ ...itemSupplierFormData, supplier_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">-- Choose a supplier --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Bulk upload links all rows in this file to the selected supplier.</p>
              </div>

              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900"><Upload className="h-4 w-4" /> Spreadsheet bulk upload</div>
                <p className="mt-1 text-xs text-indigo-800">Upload CSV/TSV rows to create and link many items to the selected supplier.</p>
                <input type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" onChange={(e) => e.target.files?.[0]?.text().then(parseBulkSupplierItems)} className="mt-2 block w-full text-sm" />
                {bulkImportColumns.length > 0 && (
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {([['productName','Product Name *'],['productType','Product Type'],['unitPrice','Unit Cost *'],['supplierSku','Supplier SKU'],['minimumOrderQuantity','MOQ'],['notes','Notes']] as const).map(([key,label]) => (
                      <label key={key} className="text-xs font-medium text-indigo-900">{label}<select value={bulkImportColumnMap[key]} onChange={(e) => setBulkImportColumnMap({ ...bulkImportColumnMap, [key]: e.target.value })} className="mt-1 w-full rounded border border-indigo-200 bg-white px-2 py-1 text-gray-900 align-top"><option value="">Do not map</option>{bulkImportColumns.map((column) => <option key={column} value={column}>{column}</option>)}</select></label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleBulkSupplierItemImport} disabled={actionLoading || bulkImportInProgress} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300">
                  {actionLoading ? 'Importing...' : `Import & Link ${bulkImportRows.length} Rows`}
                </button>
                <button type="button" onClick={() => { if (!bulkImportInProgress) setShowBulkItemSupplierModal(false); }} disabled={bulkImportInProgress} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
            {bulkImportInProgress && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/85 p-6">
                <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                  <Loader className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-700" />
                  <p className="font-semibold text-amber-900">Bulk linking in progress</p>
                  <p className="mt-1 text-sm text-amber-800">Please wait for items to finish updating. Do not close this page or modal until processing is complete.</p>
                </div>
              </div>
            )}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={productFormData.notes}
                  onChange={(e) => setProductFormData({ ...productFormData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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

      <ConfirmationModal
        isOpen={!!pendingConfirmation}
        title={pendingConfirmation?.title || ''}
        message={pendingConfirmation?.message || ''}
        confirmLabel={pendingConfirmation?.confirmLabel}
        loading={actionLoading}
        onConfirm={() => pendingConfirmation?.onConfirm()}
        onCancel={() => setPendingConfirmation(null)}
      />
    </div>
  );
}

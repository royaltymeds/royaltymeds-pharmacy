'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  AlertCircle,
  Package,
  Pill,
  X,
  Search,
} from 'lucide-react';
import {
  OTCDrug,
  PrescriptionDrug,
  OTC_CATEGORIES,
  OTC_SUBCATEGORIES,
  PRESCRIPTION_CATEGORIES,
  PRESCRIPTION_SUBCATEGORIES,
} from '@/lib/types/inventory';
import {
  createOTCDrug,
  createPrescriptionDrug,
  updateOTCDrug,
  updatePrescriptionDrug,
  deleteOTCDrug,
  deletePrescriptionDrug,
  updateInventoryQuantity,
} from '@/app/actions/inventory';
import InventoryItemForm from './inventory-item-form';
import InventoryItemTable from './inventory-item-table';

type Drug = OTCDrug | PrescriptionDrug;
type DrugType = 'otc' | 'prescription';

interface LowStockItems {
  otc: OTCDrug[];
  prescription: PrescriptionDrug[];
}

interface Props {
  initialOTCDrugs: OTCDrug[];
  initialPrescriptionDrugs: PrescriptionDrug[];
  lowStockItems: LowStockItems;
}

export default function InventoryManagementClient({
  initialOTCDrugs,
  initialPrescriptionDrugs,
  lowStockItems,
}: Props) {
  const [activeTab, setActiveTab] = useState<DrugType>('otc');
  const [otcDrugs, setOTCDrugs] = useState<OTCDrug[]>(initialOTCDrugs);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState<PrescriptionDrug[]>(initialPrescriptionDrugs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Drug | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all');

  const currentDrugs = activeTab === 'otc' ? otcDrugs : prescriptionDrugs;
  const categories = activeTab === 'otc' ? OTC_CATEGORIES : PRESCRIPTION_CATEGORIES;
  const subcategories = activeTab === 'otc' ? OTC_SUBCATEGORIES : PRESCRIPTION_SUBCATEGORIES;

  // Filter and search logic
  const filteredDrugs = useMemo(() => {
    let result = currentDrugs;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (drug) =>
          drug.name.toLowerCase().includes(query) ||
          drug.sku.toLowerCase().includes(query) ||
          drug.manufacturer?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((drug) => drug.category === selectedCategory);
    }

    // Status filter
    if (filterStatus === 'active') {
      result = result.filter((drug) => drug.status === 'active');
    } else if (filterStatus === 'low_stock') {
      result = result.filter((drug) => drug.low_stock_alert);
    } else if (filterStatus === 'out_of_stock') {
      result = result.filter((drug) => drug.status === 'out_of_stock');
    }

    return result;
  }, [currentDrugs, searchQuery, selectedCategory, filterStatus]);

  const handleAddItem = async (data: any) => {
    try {
      if (activeTab === 'otc') {
        const newDrug = await createOTCDrug(data);
        setOTCDrugs([...otcDrugs, newDrug]);
      } else {
        const newDrug = await createPrescriptionDrug(data);
        setPrescriptionDrugs([...prescriptionDrugs, newDrug]);
      }
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create drug:', error);
      alert('Failed to create drug item');
    }
  };

  const handleEditItem = async (data: any) => {
    if (!editingItem) return;

    try {
      if (activeTab === 'otc') {
        const updated = await updateOTCDrug(editingItem.id, data);
        setOTCDrugs(otcDrugs.map((drug) => (drug.id === editingItem.id ? updated : drug)));
      } else {
        const updated = await updatePrescriptionDrug(editingItem.id, data);
        setPrescriptionDrugs(
          prescriptionDrugs.map((drug) => (drug.id === editingItem.id ? updated : drug))
        );
      }
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update drug:', error);
      alert('Failed to update drug item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (activeTab === 'otc') {
        await deleteOTCDrug(id);
        setOTCDrugs(otcDrugs.filter((drug) => drug.id !== id));
      } else {
        await deletePrescriptionDrug(id);
        setPrescriptionDrugs(prescriptionDrugs.filter((drug) => drug.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete drug:', error);
      alert('Failed to delete drug item');
    }
  };

  const handleEditQuantity = async (drugId: string, newQuantity: number) => {
    try {
      await updateInventoryQuantity(activeTab, drugId, newQuantity);
      if (activeTab === 'otc') {
        setOTCDrugs(
          otcDrugs.map((drug) =>
            drug.id === drugId ? { ...drug, quantity_on_hand: newQuantity } : drug
          )
        );
      } else {
        setPrescriptionDrugs(
          prescriptionDrugs.map((drug) =>
            drug.id === drugId ? { ...drug, quantity_on_hand: newQuantity } : drug
          )
        );
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const lowStockCount =
    (activeTab === 'otc' ? lowStockItems.otc.length : lowStockItems.prescription.length) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="w-8 h-8" />
          Inventory Management
        </h1>
        <p className="text-gray-600 mt-2">Manage OTC and prescription drug inventory</p>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Low Stock Alert</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below reorder level
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => {
              setActiveTab('otc');
              setSelectedCategory('');
              setFilterStatus('all');
            }}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'otc'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Pill className="w-4 h-4" />
            OTC Drugs ({otcDrugs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('prescription');
              setSelectedCategory('');
              setFilterStatus('all');
            }}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'prescription'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Prescription Drugs ({prescriptionDrugs.length})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-40">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Add Item Button */}
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <InventoryItemForm
                drugType={activeTab}
                initialData={editingItem || undefined}
                categories={categories}
                subcategories={subcategories}
                onSubmit={editingItem ? handleEditItem : handleAddItem}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredDrugs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No items found</p>
          </div>
        ) : (
          <InventoryItemTable
            drugs={filteredDrugs}
            onEdit={(drug: Drug) => {
              setEditingItem(drug);
              setShowForm(true);
            }}
            onDelete={handleDeleteItem}
            onEditQuantity={handleEditQuantity}
          />
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredDrugs.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${filteredDrugs
              .reduce((sum, drug) => sum + drug.unit_price * drug.quantity_on_hand, 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {filteredDrugs.filter((d) => d.status === 'out_of_stock').length}
          </p>
        </div>
      </div>
    </div>
  );
}

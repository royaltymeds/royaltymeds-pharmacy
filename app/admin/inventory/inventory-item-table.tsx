'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Edit2, Trash2, AlertTriangle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { OTCDrug, PrescriptionDrug } from '@/lib/types/inventory';
import { DEFAULT_INVENTORY_IMAGE } from '@/lib/constants/inventory';

type Drug = OTCDrug | PrescriptionDrug;

interface Props {
  drugs: Drug[];
  onEdit: (drug: Drug) => void;
  onDelete: (id: string) => void;
  onEditQuantity: (drugId: string, newQuantity: number) => Promise<void>;
}

const ITEMS_PER_PAGE = 20;

export default function InventoryItemTable({
  drugs,
  onEdit,
  onDelete,
  onEditQuantity,
}: Props) {
  const [editingQuantity, setEditingQuantity] = useState<{ drugId: string; value: number } | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const toggleCardExpanded = (drugId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(drugId)) {
      newExpanded.delete(drugId);
    } else {
      newExpanded.add(drugId);
    }
    setExpandedCards(newExpanded);
  };

  const handleSaveQuantity = async (drugId: string) => {
    if (!editingQuantity || editingQuantity.drugId !== drugId) return;

    try {
      await onEditQuantity(drugId, editingQuantity.value);
      setEditingQuantity(null);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'discontinued':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'out_of_stock':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStockStatus = (drug: Drug) => {
    if (drug.status === 'out_of_stock') {
      return { label: 'Out of Stock', color: 'text-red-600', icon: true };
    } else if (drug.low_stock_alert) {
      return { label: 'Low Stock', color: 'text-yellow-600', icon: true };
    } else {
      return { label: 'In Stock', color: 'text-green-600', icon: false };
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(drugs.length / ITEMS_PER_PAGE);
  const validPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDrugs = drugs.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {drugs.length > 0 ? (
        <>
          {/* Top Pagination Controls */}
          {totalPages > 1 && (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Page {validPage} of {totalPages}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage(validPage - 1)}
                  disabled={validPage === 1}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    validPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                
                <div className="flex gap-1 items-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium transition ${
                        page === validPage
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(validPage + 1)}
                  disabled={validPage === totalPages}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    validPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Card View - Vertically Stacked */}
          <div className="space-y-3">
            {paginatedDrugs.map((drug) => {
              const isEditingQty = editingQuantity?.drugId === drug.id;
              const stockStatus = getStockStatus(drug);
              const isExpanded = expandedCards.has(drug.id);

              return (
                <div key={drug.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-4 flex justify-between items-start gap-3">
                    <button
                      onClick={() => toggleCardExpanded(drug.id)}
                      className="flex-1 text-left hover:bg-gray-50 rounded transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={drug.file_url || DEFAULT_INVENTORY_IMAGE}
                            alt={drug.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 break-words">{drug.name}</h3>
                          {drug.active_ingredient && (
                            <p className="text-xs text-gray-500 mt-1">{drug.active_ingredient}</p>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(
                          drug.status
                        )}`}
                      >
                        {drug.status.replace(/_/g, ' ').charAt(0).toUpperCase() +
                          drug.status.replace(/_/g, ' ').slice(1)}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform cursor-pointer ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        onClick={() => toggleCardExpanded(drug.id)}
                      />
                    </div>
                  </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-3">
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(drug)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(drug.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>

                  {/* Image Preview */}
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={drug.file_url || DEFAULT_INVENTORY_IMAGE}
                        alt={drug.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Category</p>
                      <p className="font-medium text-gray-900">{drug.category}</p>
                      <p className="text-xs text-gray-500">{drug.sub_category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">SKU</p>
                      <p className="font-medium text-gray-900 break-words">{drug.sku}</p>
                    </div>
                    {drug.manufacturer && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">Manufacturer</p>
                        <p className="font-medium text-gray-900">{drug.manufacturer}</p>
                      </div>
                    )}
                  </div>

                  {/* Stock Information */}
                  <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-200 pt-3">
                    <div>
                      <p className="text-gray-500 text-xs">Unit Price</p>
                      <p className="font-medium text-gray-900">${drug.unit_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total Value</p>
                      <p className="font-medium text-gray-900">
                        ${(drug.quantity_on_hand * drug.unit_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-1 text-sm border-t border-gray-200 pt-3">
                    {stockStatus.icon && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                    <span className={`text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>

                  {/* Quantity Management */}
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-500 text-xs mb-2">Quantity</p>
                    {isEditingQty ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingQuantity.value}
                          onChange={(e) =>
                            setEditingQuantity({
                              drugId: drug.id,
                              value: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveQuantity(drug.id)}
                          className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingQuantity(null)}
                          className="px-3 py-2 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">{drug.quantity_on_hand}</span>
                          <button
                            onClick={() =>
                              setEditingQuantity({ drugId: drug.id, value: drug.quantity_on_hand })
                            }
                            className="text-blue-600 hover:text-blue-700 transition-colors text-sm"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
          </div>

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Page {validPage} of {totalPages}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage(validPage - 1)}
                  disabled={validPage === 1}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    validPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                
                <div className="flex gap-1 items-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium transition ${
                        page === validPage
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(validPage + 1)}
                  disabled={validPage === totalPages}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    validPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-600 py-8 text-sm">
          No medications found.
        </p>
      )}
    </div>
  );
}

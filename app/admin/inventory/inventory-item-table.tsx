'use client';

import React, { useState } from 'react';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { OTCDrug, PrescriptionDrug } from '@/lib/types/inventory';

type Drug = OTCDrug | PrescriptionDrug;

interface Props {
  drugs: Drug[];
  onEdit: (drug: Drug) => void;
  onDelete: (id: string) => void;
  onEditQuantity: (drugId: string, newQuantity: number) => Promise<void>;
}

export default function InventoryItemTable({
  drugs,
  onEdit,
  onDelete,
  onEditQuantity,
}: Props) {
  const [editingQuantity, setEditingQuantity] = useState<{ drugId: string; value: number } | null>(null);

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Manufacturer
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
              Total Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {drugs.map((drug) => {
            const isEditingQty = editingQuantity?.drugId === drug.id;
            const stockStatus = getStockStatus(drug);

            return (
              <tr key={drug.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{drug.name}</p>
                    {drug.active_ingredient && (
                      <p className="text-xs text-gray-500">{drug.active_ingredient}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div>
                    <p className="font-medium">{drug.category}</p>
                    <p className="text-xs text-gray-500">{drug.sub_category}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {drug.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {drug.manufacturer || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {isEditingQty ? (
                    <div className="flex items-center gap-2 justify-end">
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
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveQuantity(drug.id)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingQuantity(null)}
                        className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setEditingQuantity({ drugId: drug.id, value: drug.quantity_on_hand })
                      }
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                    >
                      {drug.quantity_on_hand}
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ${drug.unit_price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ${(drug.quantity_on_hand * drug.unit_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      drug.status
                    )}`}
                  >
                    {drug.status.replace(/_/g, ' ').charAt(0).toUpperCase() +
                      drug.status.replace(/_/g, ' ').slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {stockStatus.icon && <AlertTriangle className="w-4 h-4" />}
                    <span className={`text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(drug)}
                    className="text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(drug.id)}
                    className="text-red-600 hover:text-red-700 transition-colors ml-3 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

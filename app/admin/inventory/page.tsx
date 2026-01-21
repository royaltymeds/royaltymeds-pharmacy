import React from 'react';
import { getOTCDrugs, getPrescriptionDrugs, getLowStockItems } from '@/app/actions/inventory';
import InventoryManagementClient from './inventory-management-client';

export default async function InventoryPage() {
  const [otcDrugs, prescriptionDrugs, lowStockItems] = await Promise.all([
    getOTCDrugs(),
    getPrescriptionDrugs(),
    getLowStockItems(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <InventoryManagementClient
        initialOTCDrugs={otcDrugs}
        initialPrescriptionDrugs={prescriptionDrugs}
        lowStockItems={lowStockItems}
      />
    </div>
  );
}

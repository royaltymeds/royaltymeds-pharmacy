// Types for inventory management
export interface OTCDrug {
  id: string;
  name: string;
  category: string;
  sub_category: string;
  manufacturer?: string;
  sku: string;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_price: number;
  cost_price?: number;
  description?: string;
  indications?: string;
  warnings?: string;
  side_effects?: string;
  dosage?: string;
  active_ingredient?: string;
  strength?: string;
  pack_size?: string;
  expiration_date?: string;
  lot_number?: string;
  status: 'active' | 'discontinued' | 'out_of_stock';
  low_stock_alert: boolean;
  notes?: string;
  file_url?: string;
  // Sale/Clearance fields
  category_type?: 'regular' | 'sale' | 'clearance';
  sale_price?: number;
  sale_discount_percent?: number;
  sale_start_date?: string;
  sale_end_date?: string;
  is_on_sale?: boolean;
  // Pharmacist confirmation requirement
  pharm_confirm?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionDrug {
  id: string;
  name: string;
  category: string;
  sub_category: string;
  manufacturer?: string;
  sku: string;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_price: number;
  cost_price?: number;
  description?: string;
  indications?: string;
  warnings?: string;
  side_effects?: string;
  dosage?: string;
  active_ingredient?: string;
  strength?: string;
  pack_size?: string;
  requires_refrigeration: boolean;
  controlled_substance: boolean;
  expiration_date?: string;
  lot_number?: string;
  status: 'active' | 'discontinued' | 'out_of_stock';
  low_stock_alert: boolean;
  notes?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  drug_id: string;
  drug_type: 'otc' | 'prescription';
  transaction_type: 'adjustment' | 'purchase' | 'sale' | 'expiration' | 'damage';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export type Drug = OTCDrug | PrescriptionDrug;
export type DrugType = 'otc' | 'prescription';

// Common categories
export const OTC_CATEGORIES = [
  'Pain Relief',
  'Cold & Flu',
  'Digestive',
  'Allergy & Sinus',
  'Cough & Throat',
  'Sleep & Relaxation',
  'Skin Care',
  'Vitamins & Supplements',
  'Anti-inflammatory',
  'Antacid & Heartburn',
  'Food',
  'Beverages',
  'Fashion',
  'Medical Disposables',
  'Stationary',
  'Miscellaneous',
];

export const OTC_SUBCATEGORIES: Record<string, string[]> = {
  'Pain Relief': ['Acetaminophen', 'Ibuprofen', 'Naproxen', 'Aspirin', 'Other'],
  'Cold & Flu': ['Decongestant', 'Antihistamine', 'Multi-symptom', 'Cough Suppressant', 'Other'],
  'Digestive': ['Antacid', 'Laxative', 'Anti-diarrhea', 'Probiotic', 'Other'],
  'Allergy & Sinus': ['Antihistamine', 'Decongestant', 'Nasal Spray', 'Sinus Relief', 'Other'],
  'Cough & Throat': ['Cough Suppressant', 'Throat Lozenge', 'Expectorant', 'Other'],
  'Sleep & Relaxation': ['Sleep Aid', 'Melatonin', 'Herbal Sleep', 'Other'],
  'Skin Care': ['Hydrocortisone', 'Antibiotic Ointment', 'Antifungal', 'Scar Treatment', 'Other'],
  'Vitamins & Supplements': ['Multivitamin', 'Vitamin C', 'Vitamin D', 'Mineral Supplement', 'Other'],
  'Anti-inflammatory': ['Ibuprofen', 'Naproxen', 'Aspirin', 'Other'],
  'Antacid & Heartburn': ['Antacid', 'H2 Blocker', 'Proton Pump Inhibitor', 'Other'],
  'Food': ['Snacks', 'Beverages', 'Supplements', 'Other'],
  'Beverages': ['Water', 'Sports Drinks', 'Juice', 'Tea', 'Coffee', 'Other'],
  'Fashion': ['Apparel', 'Accessories', 'Footwear', 'Other'],
  'Medical Disposables': ['Gloves', 'Masks', 'Bandages', 'Gauze', 'Other'],
  'Stationary': ['Notebooks', 'Pens', 'Office Supplies', 'Other'],
  'Miscellaneous': ['Other'],
};

export const PRESCRIPTION_CATEGORIES = [
  'Antibiotics',
  'Pain Management',
  'Cardiovascular',
  'Respiratory',
  'Gastrointestinal',
  'Endocrine',
  'Neurological',
  'Psychiatric',
  'Dermatological',
  'Antifungal',
  'Antihistamine',
  'Hormone Therapy',
  'Anti-inflammatory',
];

export const PRESCRIPTION_SUBCATEGORIES: Record<string, string[]> = {
  'Antibiotics': ['Penicillin', 'Cephalosporin', 'Macrolide', 'Fluoroquinolone', 'Tetracycline', 'Other'],
  'Pain Management': ['Opioid', 'NSAID', 'Muscle Relaxant', 'Adjuvant Analgesic', 'Other'],
  'Cardiovascular': ['ACE Inhibitor', 'Beta Blocker', 'Calcium Channel Blocker', 'Statin', 'Diuretic', 'Other'],
  'Respiratory': ['Bronchodilator', 'Inhaled Corticosteroid', 'Mucolytic', 'Antihistamine', 'Other'],
  'Gastrointestinal': ['Acid Reducer', 'Proton Pump Inhibitor', 'Antiemetic', 'Laxative', 'Other'],
  'Endocrine': ['Insulin', 'Thyroid Hormone', 'Diabetes Medication', 'Hormone', 'Other'],
  'Neurological': ['Antiepileptic', 'Migraine', 'Antiparkinsonian', 'Neuralgia', 'Other'],
  'Psychiatric': ['Antidepressant', 'Antipsychotic', 'Anti-anxiety', 'Mood Stabilizer', 'Other'],
  'Dermatological': ['Topical Antibiotic', 'Topical Corticosteroid', 'Retinoid', 'Antifungal', 'Other'],
  'Antifungal': ['Imidazole', 'Triazole', 'Polyene', 'Echinocandin', 'Other'],
  'Antihistamine': ['First Generation', 'Second Generation', 'Nasal', 'Topical', 'Other'],
  'Hormone Therapy': ['Estrogen', 'Progesterone', 'Testosterone', 'Thyroid', 'Other'],
  'Anti-inflammatory': ['NSAID', 'Corticosteroid', 'Immunosuppressant', 'Other'],
};

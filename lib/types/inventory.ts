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
];

export const OTC_SUBCATEGORIES: Record<string, string[]> = {
  'Pain Relief': ['Acetaminophen', 'Ibuprofen', 'Naproxen', 'Aspirin'],
  'Cold & Flu': ['Decongestant', 'Antihistamine', 'Multi-symptom', 'Cough Suppressant'],
  'Digestive': ['Antacid', 'Laxative', 'Anti-diarrhea', 'Probiotic'],
  'Allergy & Sinus': ['Antihistamine', 'Decongestant', 'Nasal Spray', 'Sinus Relief'],
  'Cough & Throat': ['Cough Suppressant', 'Throat Lozenge', 'Expectorant'],
  'Sleep & Relaxation': ['Sleep Aid', 'Melatonin', 'Herbal Sleep'],
  'Skin Care': ['Hydrocortisone', 'Antibiotic Ointment', 'Antifungal', 'Scar Treatment'],
  'Vitamins & Supplements': ['Multivitamin', 'Vitamin C', 'Vitamin D', 'Mineral Supplement'],
  'Anti-inflammatory': ['Ibuprofen', 'Naproxen', 'Aspirin'],
  'Antacid & Heartburn': ['Antacid', 'H2 Blocker', 'Proton Pump Inhibitor'],
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
  'Antibiotics': ['Penicillin', 'Cephalosporin', 'Macrolide', 'Fluoroquinolone', 'Tetracycline'],
  'Pain Management': ['Opioid', 'NSAID', 'Muscle Relaxant', 'Adjuvant Analgesic'],
  'Cardiovascular': ['ACE Inhibitor', 'Beta Blocker', 'Calcium Channel Blocker', 'Statin', 'Diuretic'],
  'Respiratory': ['Bronchodilator', 'Inhaled Corticosteroid', 'Mucolytic', 'Antihistamine'],
  'Gastrointestinal': ['Acid Reducer', 'Proton Pump Inhibitor', 'Antiemetic', 'Laxative'],
  'Endocrine': ['Insulin', 'Thyroid Hormone', 'Diabetes Medication', 'Hormone'],
  'Neurological': ['Antiepileptic', 'Migraine', 'Antiparkinsonian', 'Neuralgia'],
  'Psychiatric': ['Antidepressant', 'Antipsychotic', 'Anti-anxiety', 'Mood Stabilizer'],
  'Dermatological': ['Topical Antibiotic', 'Topical Corticosteroid', 'Retinoid', 'Antifungal'],
  'Antifungal': ['Imidazole', 'Triazole', 'Polyene', 'Echinocandin'],
  'Antihistamine': ['First Generation', 'Second Generation', 'Nasal', 'Topical'],
  'Hormone Therapy': ['Estrogen', 'Progesterone', 'Testosterone', 'Thyroid'],
  'Anti-inflammatory': ['NSAID', 'Corticosteroid', 'Immunosuppressant'],
};

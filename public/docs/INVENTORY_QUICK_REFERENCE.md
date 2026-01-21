# Inventory Management System - Quick Reference

## Access
**URL:** `https://royaltymedspharmacy.com/admin/inventory`

## Quick Start

### Adding a Drug
1. Click **"Add Item"** button (top right)
2. Select **OTC** or **Prescription** tab
3. Fill required fields:
   - Drug name
   - Category → Sub-category
   - SKU
   - Unit price
4. Click **"Add Item"**

### Editing a Drug
1. Click **"Edit"** button on any row
2. Modify any field in modal
3. Click **"Update Item"**

### Quick Quantity Update
1. Click the **quantity number** in table
2. Enter new amount
3. Click **"Save"**
4. Transaction logged automatically

### Deleting a Drug
1. Click **"Delete"** button on any row
2. Confirm deletion
3. Item removed from inventory

## Filtering & Search

| What | How |
|------|-----|
| Search | Enter name/SKU/manufacturer in search box |
| By Category | Select from category dropdown |
| By Status | All / Active / Low Stock / Out of Stock |
| Multiple Filters | Combine search + category + status |

## Key Information Fields

### All Drugs Store
- Name, SKU, Category/Sub-category
- Manufacturer, Active ingredient
- Strength, Pack size
- Quantity on hand, Unit price
- Indications, Warnings, Side effects
- Dosage, Expiration date, Lot number

### Prescription Drugs Only
- Requires refrigeration? (checkbox)
- Controlled substance? (checkbox)

## Settings

| Field | Purpose |
|-------|---------|
| Quantity on Hand | Current stock level |
| Reorder Level | Quantity that triggers alert |
| Reorder Quantity | Default amount to order |
| Unit Price | Selling price per unit |
| Cost Price | Acquisition cost (optional) |

## Dashboard Stats

- **Total Items** - Count of all drugs
- **Total Value** - Sum of inventory value
- **Low Stock** - Items below reorder level
- **Out of Stock** - Items with zero quantity

## Status Types

| Status | Meaning |
|--------|---------|
| Active | In use, available for dispensing |
| Discontinued | No longer ordered |
| Out of Stock | Zero quantity available |

## Stock Indicators

| Indicator | Meaning |
|-----------|---------|
| In Stock | Quantity > reorder level |
| Low Stock | Quantity ≤ reorder level |
| Out of Stock | Status = out_of_stock |

## OTC Categories
Pain Relief, Cold & Flu, Digestive, Allergy & Sinus, Cough & Throat, Sleep & Relaxation, Skin Care, Vitamins & Supplements, Anti-inflammatory, Antacid & Heartburn

## Prescription Categories
Antibiotics, Pain Management, Cardiovascular, Respiratory, Gastrointestinal, Endocrine, Neurological, Psychiatric, Dermatological, Antifungal, Antihistamine, Hormone Therapy, Anti-inflammatory

## Keyboard Shortcuts
- No shortcuts (use buttons and dropdowns)

## Common Tasks

### Check Low Stock Items
1. Look at top banner or click status filter "Low Stock"
2. Review list of items to reorder
3. Use "Reorder Quantity" field as ordering guide

### View Inventory Value
1. Check dashboard stat: "Total Inventory Value"
2. Or calculate: quantity × unit_price for each item

### Find a Specific Drug
1. Type name/SKU in search box
2. Or filter by category
3. Results update instantly

### Track Drug Changes
- All edits tracked in database
- Quantity changes logged as transactions
- Contact admin for transaction history

## Admin-Only Features
- All inventory functions restricted to admins
- View requires authentication
- No patient/doctor access
- All changes audited

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find item | Try searching by SKU instead |
| Low stock alert wrong | Check reorder_level value |
| Form validation error | Fill all required fields |
| Permission denied | Ensure you have admin role |

## Database Operations
- Automatic transaction logging
- Real-time updates across system
- Data backed up by Supabase
- Changes immediately visible

## Tips & Best Practices

✅ **DO:**
- Set realistic reorder levels based on usage
- Update quantity when receiving stock
- Include lot numbers for batch tracking
- Add expiration dates for safety
- Use notes field for internal comments

❌ **DON'T:**
- Delete drugs with prescription history (mark discontinued instead)
- Manually delete without verifying quantity
- Leave reorder level at default
- Skip expiration dates for regulated items

## Reports Available
- Inventory value (dashboard)
- Low stock alerts (top banner)
- Transaction history (via database query)

## Future Features (Planned)
- Barcode scanning
- Purchase order generation
- Supplier management
- Stock forecasting
- Advanced reporting

## Support
- For issues: Contact IT/Admin
- For suggestions: Submit feature request
- For training: Review full documentation

---

**System Status:** ✅ LIVE & OPERATIONAL
**Last Updated:** January 20, 2026

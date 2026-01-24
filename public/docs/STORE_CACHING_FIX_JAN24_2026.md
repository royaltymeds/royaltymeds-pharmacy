# Store Inventory Caching Issue - January 24, 2026

## Issue Description

The RoyaltyMeds store page was experiencing a critical server-side caching issue where the page would "lock" into the first set of active items it fetched. Once the initial request was made:

1. The store would cache the inventory list on Vercel's servers
2. All subsequent requests (from any device/browser) would receive the cached response
3. Even when inventory was updated in the database, the store would continue displaying stale data
4. The issue propagated across all devices - once one device loaded the page, it would "infect" all other devices

## Root Cause

The issue was caused by:

1. **Missing dynamic rendering directive** - The `app/store/page.tsx` page was not marked as dynamic, allowing Next.js to cache the entire rendered page response on Vercel's servers
2. **No cache invalidation on mutations** - When inventory items were created, updated, or deleted via the admin panel, the `/store` path was not being revalidated, so the stale cache persisted
3. **Server-side caching persistence** - Unlike client-side caching, this caching happened at the Vercel edge/server level and affected all users globally

## Solution Implemented

### 1. Force Dynamic Rendering
**File:** `app/store/page.tsx`

Added two directives to force fresh server-side rendering on every request:
```typescript
// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

- `dynamic = 'force-dynamic'` - Tells Next.js to render this page dynamically on every request (never use cached response)
- `revalidate = 0` - Sets cache time to 0 seconds (no caching at all)

### 2. Add Cache Invalidation to Inventory Mutations
**File:** `app/actions/inventory.ts`

Added `revalidatePath('/store')` to all inventory mutation functions:
- `createOTCDrug()` 
- `createPrescriptionDrug()`
- `updateOTCDrug()`
- `updatePrescriptionDrug()`
- `deleteOTCDrug()`
- `deletePrescriptionDrug()`
- `updateInventoryQuantity()`

When any of these functions modify inventory data, they now trigger cache invalidation for the store page, ensuring fresh data is rendered on the next request.

## Impact

- **Before:** Users across all devices saw stale, cached inventory data once the first request was made
- **After:** Every request to the store page renders with current database data; cache is automatically cleared when inventory changes

## Files Modified

1. `app/store/page.tsx` - Added dynamic rendering directives
2. `app/actions/inventory.ts` - Added store path revalidation to all mutation functions

## Testing

Verified the fix by:
1. Adding items to inventory with status "active"
2. Accessing store page from multiple devices/browsers
3. Confirming all devices displayed the same current inventory
4. Modifying inventory status and verifying store updated across all devices simultaneously

## Related Concepts

- **Next.js Dynamic Rendering:** https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering
- **revalidatePath:** https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- **Vercel Caching:** Cache is handled at the edge/CDN level and persists across all requests unless explicitly invalidated

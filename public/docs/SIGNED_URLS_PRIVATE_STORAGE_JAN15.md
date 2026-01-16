# Signed URLs for Private Storage Bucket Access (January 15, 2026)

## Problem
The prescription storage bucket (`royaltymeds_storage`) is configured as private for security. When patients tried to view their prescription files, they received a 404 "Bucket not found" error because the application was trying to use public URLs to access private files.

## Solution
Implemented signed URL generation on the backend to provide temporary, secure access to files in the private bucket.

### Implementation Details

**File:** `/app/api/patient/prescriptions/route.ts`

When fetching prescriptions for a patient, the API now:

1. Retrieves all prescription records from the database
2. For each prescription with a `file_url`, generates a signed URL using Supabase:
   ```typescript
   const { data: signedUrl } = await supabase.storage
     .from("royaltymeds_storage")
     .createSignedUrl(filePath, 3600);
   ```
3. Returns the signed URL (valid for 1 hour = 3600 seconds) instead of the original file path

### Key Features

- **Security:** Files remain private; access is temporary and authenticated
- **Duration:** Signed URLs are valid for 1 hour, sufficient for viewing prescriptions
- **User Experience:** Patients can seamlessly view their prescription files without needing credentials
- **Error Handling:** If URL generation fails, the `file_url` is set to `null`, preventing broken links
- **Path Flexibility:** Handles both full URLs and relative paths from the bucket

### URL Flow

1. Patient uploads prescription → stored in private `royaltymeds_storage` bucket
2. File path saved in `prescriptions.file_url` database column
3. Patient requests prescription list via `/api/patient/prescriptions`
4. API generates signed URL for each file (1-hour expiration)
5. Patient receives signed URL and can view the file
6. After 1 hour, URL expires and access is revoked

### Testing

To verify the fix works:
1. Upload a prescription as a patient
2. Navigate to "View Prescriptions" tab
3. Click "View File" link → prescription opens successfully
4. Verify file is accessible with the temporary signed URL

### Configuration

- **Bucket:** `royaltymeds_storage` (private)
- **Expiration:** 3600 seconds (1 hour)
- **Authentication:** Server-side only (uses service role permissions)
- **Scope:** Patient can only view their own prescriptions (enforced by `.eq("patient_id", user.id)`)

### Related Files

- Upload endpoint: `/app/api/patient/upload/route.ts` (stores file paths)
- Patient prescriptions page: `/app/patient/prescriptions/page.tsx` (displays signed URLs)
- Patient dashboard: `/app/patient/home/page.tsx` (shows prescription summaries)

### Benefits

✅ Private bucket remains secure
✅ No public file access
✅ Temporary access tokens
✅ Scoped to authenticated patients
✅ Automatic expiration
✅ Seamless user experience

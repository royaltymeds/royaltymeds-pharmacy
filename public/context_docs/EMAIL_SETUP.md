# Email Integration Setup Guide

## Current Implementation

The RoyaltyMeds platform now supports **actual email sending** via SMTP using **nodemailer**. This guide explains how to configure Gmail or Google Workspace email accounts.

---

## Configuration Options

### Option 1: Gmail (Free Personal Account)

**Prerequisites:**
- Gmail account
- 2-Step Verification enabled
- App Password generated

**Setup Steps:**

1. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Select "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate password (16-character code)
   - Copy the generated password

3. **Environment Variables**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   SMTP_FROM=your-email@gmail.com
   ```

---

### Option 2: Google Workspace (Business Account)

**Prerequisites:**
- Google Workspace account with admin access
- SMTP Relay enabled (no app passwords needed)

**Setup Steps:**

1. **Enable SMTP Relay**
   - Go to https://admin.google.com/
   - Navigate to Apps → Google Workspace → Gmail
   - Click "Gmail security"
   - Under "Less secure app access," enable "Allow users to manage their access to less secure apps"
   - Or use Gmail SMTP relay for all users (recommended for production)

2. **Option A: Individual User Credentials**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=service-account@yourcompany.com
   SMTP_PASS=your-workspace-password
   SMTP_FROM=noreply@yourcompany.com
   ```

3. **Option B: SMTP Relay Service (Recommended)**
   - Setup: https://support.google.com/a/answer/176600
   - No authentication needed
   ```env
   SMTP_HOST=smtp-relay.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=  # Leave empty
   SMTP_PASS=  # Leave empty
   SMTP_FROM=noreply@yourcompany.com
   ```

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Gmail/Google Workspace SMTP Configuration
SMTP_HOST=smtp.gmail.com              # or smtp-relay.gmail.com for relay
SMTP_PORT=587                         # 587 for TLS, 465 for SSL
SMTP_SECURE=false                     # false for TLS, true for SSL
SMTP_USER=your-email@gmail.com        # Your email address
SMTP_PASS=your-app-password           # App password (16 chars with spaces)
SMTP_FROM=noreply@royaltymedspharmacy.com  # From email address
```

---

## API Usage

### Sending an Email

```bash
curl -X POST http://localhost:3000/api/emails/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "patient@example.com",
    "subject": "Order Confirmation",
    "type": "order_confirmation",
    "data": {
      "orderId": "ORD-123456",
      "amount": 49.99,
      "items": [
        { "name": "Medication A", "quantity": 1, "price": 49.99 }
      ]
    }
  }'
```

### Available Email Types

- `order_confirmation` - Order placed notification
- `order_shipped` - Order shipment notification with tracking
- `prescription_approved` - Prescription approved by pharmacist
- `refill_approved` - Refill request approved
- `refill_rejected` - Refill request rejected
- `custom` - Custom email with htmlContent/textContent

### Response

**Success:**
```json
{
  "message": "Email sent successfully",
  "messageId": "email@example.com",
  "recipients": ["patient@example.com"]
}
```

**Error:**
```json
{
  "error": "Failed to send email",
  "details": "SMTP error message"
}
```

---

## Database Tracking

All emails are logged in the `email_logs` table:

```sql
SELECT * FROM email_logs
WHERE templateType = 'order_confirmation'
ORDER BY sentAt DESC;
```

**Email Log Fields:**
- `recipientEmail` - Where email was sent
- `subject` - Email subject
- `templateType` - Type of email
- `status` - 'sent', 'failed', 'bounced', 'opened', 'clicked'
- `sentAt` - Timestamp
- `failureReason` - Error message if failed
- `messageId` - SMTP message ID
- `metadata` - Additional data (recipients, template data, SMTP response)

---

## Email Templates

### Managing Templates

**Get all templates:**
```bash
curl -X GET http://localhost:3000/api/admin/email-templates \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Create custom template:**
```bash
curl -X POST http://localhost:3000/api/admin/email-templates \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_template",
    "type": "custom",
    "subject": "Your Subject Here",
    "htmlContent": "<h1>Hello {{name}}</h1>",
    "textContent": "Hello {{name}}",
    "variables": ["name"],
    "enabled": true
  }'
```

### Default Templates

Pre-loaded templates use variable placeholders:

**Order Confirmation:**
```
Subject: Order Confirmation - {{orderId}}
Variables: orderId, amount, items
```

**Prescription Approved:**
```
Subject: Your Prescription Has Been Approved
Variables: prescriptionId, medicationName, quantity
```

---

## Troubleshooting

### "SMTP Error: 535 5.7.8 Username and password not accepted"

**Gmail:**
- Verify you're using the 16-character **app password** (not your regular password)
- Check 2-Step Verification is enabled
- Regenerate app password if uncertain

**Google Workspace:**
- Confirm SMTP relay is enabled in admin console
- Check user has "Less secure app access" enabled (if not using relay)
- Verify credentials are correct

### "SMTP Error: 530 5.7.0 Must issue a STARTTLS command first"

- Ensure `SMTP_PORT=587` and `SMTP_SECURE=false`
- (SSL mode would be `SMTP_PORT=465` and `SMTP_SECURE=true`)

### Emails not appearing in logs

- Check `email_logs` table exists: `SELECT * FROM email_logs LIMIT 1;`
- Verify Supabase `SUPABASE_SERVICE_ROLE_KEY` environment variable is set
- Check application logs for database errors

### High volume email sending

For production with thousands of emails:
- Consider **Google Workspace SMTP Relay** (unlimited, no authentication)
- Use async job queue (Bull, Inngest, etc.) instead of direct API calls
- Implement exponential backoff for retries
- Monitor bounce/failure rates

---

## Testing

### Send Test Email

```javascript
// Using browser console or Postman
const response = await fetch('/api/emails/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_AUTH_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'test@example.com',
    subject: 'Test Email',
    type: 'order_confirmation',
    data: {
      orderId: 'TEST-001',
      amount: 9.99,
      items: [{ name: 'Test Item', quantity: 1, price: 9.99 }],
    },
  }),
});

const result = await response.json();
console.log(result);
```

---

## Production Considerations

✅ **Recommended:**
- Use Google Workspace SMTP Relay for unlimited emails
- Implement email retry logic with exponential backoff
- Monitor email failure rates and bounce rates
- Use separate "noreply" email address for automated messages
- Add unsubscribe links to marketing emails
- Implement email verification for new patient accounts

⚠️ **Best Practices:**
- Never commit SMTP credentials to git (use environment variables)
- Use service account email for "From" field
- Set reply-to address appropriately
- Test email templates before production deployment
- Monitor email delivery metrics in logs

---

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/emails/send` | Send email |
| GET | `/api/admin/email-templates` | List templates |
| POST | `/api/admin/email-templates` | Create/update template |
| GET | `/api/admin/email-logs` | View sent emails |
| GET | `/api/patient/email-preferences` | Get user preferences |
| PUT | `/api/patient/email-preferences` | Update preferences |

---

## Support

For issues:
1. Check email_logs table for failure reasons
2. Verify environment variables are set correctly
3. Test SMTP credentials with online tool: https://www.gmailsmtptest.com/
4. Check Gmail/Workspace security settings
5. Review application logs for detailed error messages

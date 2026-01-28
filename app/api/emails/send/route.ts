import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize SMTP transporter with Gmail/Google Workspace
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailRequest {
  to: string | string[];
  subject: string;
  type: 'order_confirmation' | 'order_shipped' | 'prescription_approved' | 'refill_approved' | 'refill_rejected' | 'password_reset' | 'verification' | 'custom';
  data?: Record<string, any>;
  htmlContent?: string;
  textContent?: string;
}

// Helper function to generate email templates
function generateEmailTemplate(type: string, data: Record<string, any>): { html: string; text: string } {
  switch (type) {
    case 'order_confirmation':
      return {
        html: `
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
          <p><strong>Items:</strong></p>
          <ul>
            ${data.items.map((item: any) => `<li>${item.name} x${item.quantity} - $${item.price.toFixed(2)}</li>`).join('')}
          </ul>
          <p>Your order will be processed shortly.</p>
        `,
        text: `Order Confirmation\n\nThank you for your order!\n\nOrder ID: ${data.orderId}\nAmount: $${data.amount.toFixed(2)}\n\nItems:\n${data.items.map((item: any) => `${item.name} x${item.quantity} - $${item.price.toFixed(2)}`).join('\n')}`,
      };

    case 'order_shipped':
      return {
        html: `
          <h2>Order Shipped</h2>
          <p>Your order has been shipped!</p>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
        `,
        text: `Order Shipped\n\nYour order has been shipped!\n\nOrder ID: ${data.orderId}\nTracking Number: ${data.trackingNumber}\nEstimated Delivery: ${data.estimatedDelivery}`,
      };

    case 'prescription_approved':
      return {
        html: `
          <h2>Prescription Approved</h2>
          <p>Your prescription has been approved by the pharmacist.</p>
          <p><strong>Prescription ID:</strong> ${data.prescriptionId}</p>
          <p><strong>Medication:</strong> ${data.medicationName}</p>
          <p><strong>Quantity:</strong> ${data.quantity}</p>
          <p>You can now view and purchase your prescription in your account.</p>
        `,
        text: `Prescription Approved\n\nYour prescription has been approved by the pharmacist.\n\nPrescription ID: ${data.prescriptionId}\nMedication: ${data.medicationName}\nQuantity: ${data.quantity}`,
      };

    case 'refill_approved':
      return {
        html: `
          <h2>Refill Approved</h2>
          <p>Your prescription refill has been approved!</p>
          <p><strong>Prescription ID:</strong> ${data.prescriptionId}</p>
          <p><strong>Medication:</strong> ${data.medicationName}</p>
          <p><strong>Refills Remaining:</strong> ${data.refillsRemaining}</p>
        `,
        text: `Refill Approved\n\nYour prescription refill has been approved!\n\nPrescription ID: ${data.prescriptionId}\nMedication: ${data.medicationName}\nRefills Remaining: ${data.refillsRemaining}`,
      };

    case 'refill_rejected':
      return {
        html: `
          <h2>Refill Rejected</h2>
          <p>Your refill request has been rejected.</p>
          <p><strong>Prescription ID:</strong> ${data.prescriptionId}</p>
          <p><strong>Medication:</strong> ${data.medicationName}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p>Please contact your healthcare provider for more information.</p>
        `,
        text: `Refill Rejected\n\nYour refill request has been rejected.\n\nPrescription ID: ${data.prescriptionId}\nMedication: ${data.medicationName}\nReason: ${data.reason}`,
      };

    case 'password_reset':
      return {
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password.</p>
          <p><a href="${data.resetLink}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
        text: `Password Reset Request\n\nYou requested a password reset. Visit the link below to reset your password:\n${data.resetLink}\n\nThis link will expire in 1 hour.`,
      };

    case 'verification':
      return {
        html: `
          <h2>Verify Your Email</h2>
          <p>Please verify your email address to complete your registration.</p>
          <p><a href="${data.verificationLink}">Verify Email</a></p>
          <p>This link will expire in 24 hours.</p>
        `,
        text: `Verify Your Email\n\nPlease verify your email address to complete your registration.\n${data.verificationLink}`,
      };

    default:
      return {
        html: data.htmlContent || '<p>No content</p>',
        text: data.textContent || 'No content',
      };
  }
}

// POST: Send email
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const body: EmailRequest = await request.json();
    const { to, subject, type, data = {} } = body;

    if (!to || !subject || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, type' },
        { status: 400 }
      );
    }

    // Generate email template
    generateEmailTemplate(type, data); // Generate for future use (Edge Function implementation)

    // Prepare recipients
    const recipients = Array.isArray(to) ? to : [to];

    try {
      // Send email via SMTP
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipients.join(','),
        subject,
        html: generateEmailTemplate(type, data).html,
        text: generateEmailTemplate(type, data).text,
      });

      // Log successful send to database
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          recipientEmail: recipients[0],
          subject,
          templateType: type,
          status: 'sent',
          sentAt: new Date().toISOString(),
          messageId: info.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: { recipients, type, data, smtpResponse: info.response },
        })
        .select()
        .single();

      if (logError) {
        console.error('Failed to log email:', logError);
      }

      return NextResponse.json({
        message: 'Email sent successfully',
        messageId: info.messageId,
        recipients,
      });
    } catch (sendError) {
      console.error('SMTP Error:', sendError);

      // Log failed send to database
      await supabase
        .from('email_logs')
        .insert({
          recipientEmail: recipients[0],
          subject,
          templateType: type,
          status: 'failed',
          sentAt: new Date().toISOString(),
          failureReason: sendError instanceof Error ? sendError.message : 'Unknown error',
          messageId: `msg_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: { recipients, type, data, error: sendError instanceof Error ? sendError.message : 'Unknown' },
        });

      return NextResponse.json(
        { error: 'Failed to send email', details: sendError instanceof Error ? sendError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

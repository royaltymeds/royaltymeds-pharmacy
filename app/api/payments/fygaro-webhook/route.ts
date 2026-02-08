import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Fygaro Webhook Handler
 * 
 * Receives payment notifications from Fygaro and updates order status to 'paid'
 * when payment is successfully processed.
 * 
 * Webhook payload structure (expected from Fygaro):
 * {
 *   event: 'payment.success' | 'payment.failed' | 'payment.pending',
 *   payment_id: string,
 *   amount: number,
 *   currency: string,
 *   custom_reference: string (order ID),
 *   status: 'completed' | 'failed' | 'pending',
 *   timestamp: string
 * }
 */

export async function POST(req: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = await req.json();
    console.log('Fygaro Webhook Received:', {
      event: payload.event,
      orderId: payload.custom_reference,
      status: payload.status,
      amount: payload.amount,
      currency: payload.currency,
    });

    // Validate required fields
    if (!payload.custom_reference || !payload.status) {
      console.error('Invalid webhook payload - missing required fields');
      return NextResponse.json(
        { error: 'Invalid payload: missing custom_reference or status' },
        { status: 400 }
      );
    }

    const orderId = payload.custom_reference;
    const paymentStatus = payload.status;

    // Only update order if payment was successful
    if (paymentStatus !== 'completed' && paymentStatus !== 'success') {
      console.log(
        `Webhook received for order ${orderId} with status: ${paymentStatus}. Skipping update.`
      );
      return NextResponse.json(
        { success: true, message: 'Webhook received but payment not successful' },
        { status: 200 }
      );
    }

    // Initialize Supabase with service role for backend operations
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for webhook (server-only, trusted operation)
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          },
        },
      }
    );

    // Update order status to 'paid'
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('Order updated successfully:', {
      orderId,
      paymentStatus: 'paid',
      amount: payload.amount,
      currency: payload.currency,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Order payment status updated',
        orderId,
        paymentStatus: 'paid',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fygaro webhook error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

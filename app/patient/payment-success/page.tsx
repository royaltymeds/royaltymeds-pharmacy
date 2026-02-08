import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default async function PaymentSuccessPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get the most recent paid order for this user
  const { data: recentOrder, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, payment_status, total_amount, created_at')
    .eq('user_id', user.id)
    .eq('payment_status', 'payment_verified')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // If webhook hasn't processed yet, show loading state
  const showLoading = orderError && orderError.code === 'PGRST116';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        <div className="text-center">
          {showLoading ? (
            <>
              <div className="flex justify-center mb-4">
                <Loader className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Payment
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment is being processed. Please wait a moment...
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                You can safely close this page and check your order status in the portal.
              </div>
            </>
          ) : recentOrder ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment has been received and processed.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Order ID:</strong> {recentOrder.order_number}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Amount:</strong> JMD{' '}
                  {typeof recentOrder.total_amount === 'number'
                    ? recentOrder.total_amount.toFixed(2)
                    : parseFloat(recentOrder.total_amount?.toString() || '0').toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong>{' '}
                  <span className="text-green-600 font-semibold">Payment Verified</span>
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Your order is now being prepared. You can track it in your dashboard.
              </p>

              <Link
                href="/patient/orders"
                className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                View My Orders
              </Link>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-16 h-16 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Status Pending
              </h1>
              <p className="text-gray-600 mb-6">
                We&rsquo;re verifying your payment. If your payment was successful, it will appear
                in your dashboard shortly.
              </p>

              <Link
                href="/patient/orders"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
              >
                Check My Orders
              </Link>

              <Link
                href="/patient/home"
                className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Return Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

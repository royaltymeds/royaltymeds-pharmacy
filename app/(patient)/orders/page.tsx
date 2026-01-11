import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PackageIcon, TruckIcon, CheckCircleIcon } from "lucide-react";

export default async function OrdersPage() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch orders with related data
  const { data: ordersData } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      total_amount,
      currency,
      payment_status,
      delivery_type,
      tracking_number,
      estimated_delivery_date,
      created_at,
      prescription_id,
      prescriptions(id, medication_name)
    `
    )
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  // Type the orders properly
  const orders = (ordersData as any) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "in_transit":
        return <TruckIcon className="w-5 h-5 text-blue-600" />;
      case "ready":
        return <PackageIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <PackageIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/patient/home"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track your prescriptions and deliveries</p>
        </div>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Link key={order.id} href={`/patient/orders/${order.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-indigo-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.prescriptions?.medication_name || "Prescription Order"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${order.total_amount?.toFixed(2) || "0.00"}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Payment</p>
                      <p className="font-medium text-gray-900 capitalize mt-1">
                        {order.payment_status}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Delivery Type</p>
                      <p className="font-medium text-gray-900 capitalize mt-1">
                        {order.delivery_type}
                      </p>
                    </div>
                    {order.estimated_delivery_date && (
                      <div>
                        <p className="text-gray-600 text-xs">Est. Delivery</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {new Date(order.estimated_delivery_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div>
                        <p className="text-gray-600 text-xs">Tracking</p>
                        <p className="font-medium text-gray-900 mt-1 truncate">
                          {order.tracking_number}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    Ordered on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">
              Start by uploading a prescription to place your first order.
            </p>
            <Link
              href="/patient/prescriptions"
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Upload Prescription
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

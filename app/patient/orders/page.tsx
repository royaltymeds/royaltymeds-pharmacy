import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PackageIcon, TruckIcon, CheckCircleIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface Order {
  id: string;
  prescription_id: string;
  status: string;
  created_at: string;
  estimated_delivery?: string;
  total_amount?: number;
  payment_status?: string;
  delivery_type?: string;
  estimated_delivery_date?: string;
  tracking_number?: string;
  prescriptions?: { medication_name: string };
}

async function getOrders(userId: string): Promise<Order[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    case "in_transit":
      return <TruckIcon className="w-5 h-5 text-blue-600" />;
    default:
      return <PackageIcon className="w-5 h-5 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "in_transit":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function OrdersPage() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch orders
  const orders = await getOrders(user.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-600">
        <h1 className="text-lg sm:text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">Track your prescriptions and deliveries</p>
      </div>

      {/* Orders List */}
      {orders && orders.length > 0 ? (
        <div className="space-y-3 sm:space-y-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 auto-rows-max">
          {orders.map((order) => (
            <Link key={order.id} href={`/patient/orders/${order.id}`}>
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition cursor-pointer border-t-4 border-green-500 h-full">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {getStatusIcon(order.status)}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                          {order.prescriptions?.medication_name || "Prescription Order"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      ${order.total_amount?.toFixed(2) || "0.00"}
                    </p>
                    <span className={`inline-block mt-2 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div>
                    <p className="text-xs font-medium">Payment</p>
                    <p className="font-medium text-gray-900 capitalize mt-1">
                      {order.payment_status || "pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Delivery</p>
                    <p className="font-medium text-gray-900 capitalize mt-1">
                      {order.delivery_type || "standard"}
                    </p>
                  </div>
                  {order.estimated_delivery_date && (
                    <div>
                      <p className="text-xs font-medium">Est. Delivery</p>
                      <p className="font-medium text-gray-900 mt-1 text-xs">
                        {new Date(order.estimated_delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div>
                      <p className="text-xs font-medium">Tracking</p>
                      <p className="font-medium text-gray-900 mt-1 truncate text-xs">
                        {order.tracking_number}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-3 sm:mt-4">
                  Ordered on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-12 text-center">
          <PackageIcon className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-6">
            Your orders will appear here once you place them.
          </p>
          <Link
            href="/patient/prescriptions"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
          >
            Upload Prescription
          </Link>
        </div>
      )}
    </div>
  );
}

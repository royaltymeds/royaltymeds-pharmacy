import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Truck, Package, CheckCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

interface Order {
  id: string;
  patient_id: string;
  prescription_id: string;
  status: string;
  created_at: string;
  total_price: number;
}

async function getOrders(): Promise<Order[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "processing":
      return <Package className="w-4 h-4" />;
    case "delivered":
      return <CheckCircle className="w-4 h-4" />;
    case "cancelled":
      return <Truck className="w-4 h-4" />;
    default:
      return null;
  }
}

export default async function AdminOrders() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch orders
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Track and update order status</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Medication
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Payment
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders && orders.length > 0 ? (
                (orders as any[]).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {order.users?.user_profiles?.full_name || "Unknown"}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                      {order.prescriptions?.medication_name || "N/A"}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      ${(order.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="hidden sm:inline">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span
                        className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          order.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.payment_status?.charAt(0).toUpperCase() +
                          (order.payment_status?.slice(1) || "pending")}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 sm:px-6 py-8 text-center text-xs sm:text-sm text-gray-600">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {orders && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600">Pending</p>
            <p className="text-xl sm:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">
              {(orders as any[]).filter((o) => o.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600">Processing</p>
            <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
              {(orders as any[]).filter((o) => o.status === "processing").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600">Delivered</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
              {(orders as any[]).filter((o) => o.status === "delivered").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6 col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
              ${(orders as any[]).reduce((sum, o) => sum + (o.amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

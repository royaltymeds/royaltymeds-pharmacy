'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getRestockRequestById,
  updateRestockRequestStatus,
  approveRestockRequest,
  rejectRestockRequest,
  recordReceivedQuantities,
  getRestockHistory,
} from '@/app/actions/restock';
import { RestockRequest } from '@/lib/types/restock';
import { AlertCircle, Loader, CheckCircle, XCircle, Package, Clock } from 'lucide-react';

interface RestockRequestDetailProps {
  requestId: string;
  userId: string;
}

export function RestockRequestDetail({ requestId, userId }: RestockRequestDetailProps) {
  const [request, setRequest] = useState<RestockRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    const { data } = await getRestockRequestById(requestId);
    if (data) {
      setRequest(data);
      // Initialize received quantities
      const quantities: Record<string, number> = {};
      data.items?.forEach((item) => {
        quantities[item.id] = item.quantity_received || 0;
      });
      setReceivedQuantities(quantities);

      // Load history
      const { data: historyData } = await getRestockHistory(requestId);
      // History data available but not used in current implementation
      void historyData;
    }
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleApprove = async () => {
    setActionLoading(true);
    setError(null);

    const { error: approveError } = await approveRestockRequest(
      requestId,
      userId,
      approvalNotes
    );

    if (approveError) {
      setError(approveError);
    } else {
      setShowApproveModal(false);
      await loadRequest();
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setError(null);

    const { error: rejectError } = await rejectRestockRequest(
      requestId,
      userId,
      rejectionReason
    );

    if (rejectError) {
      setError(rejectError);
    } else {
      setShowRejectModal(false);
      await loadRequest();
    }
    setActionLoading(false);
  };

  const handleReceive = async () => {
    setActionLoading(true);
    setError(null);

    const updates = Object.entries(receivedQuantities).map(([itemId, quantity]) => ({
      itemId,
      quantity_received: quantity,
    }));

    const { error: receiveError } = await recordReceivedQuantities(updates);

    if (receiveError) {
      setError(receiveError);
    } else {
      const { error: statusError } = await updateRestockRequestStatus(
        requestId,
        'received',
        userId
      );

      if (statusError) {
        setError(statusError);
      } else {
        setShowReceiveModal(false);
        await loadRequest();
      }
    }
    setActionLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock },
      approved: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
      submitted: { bg: 'bg-purple-50', text: 'text-purple-700', icon: Package },
      received: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
      cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', icon: XCircle },
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-red-700 font-medium">Restock request not found</p>
      </div>
    );
  }

  const statusColor = getStatusColor(request.status);
  const StatusIcon = statusColor.icon;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Header Card */}
      <div className={`${statusColor.bg} border border-gray-300 rounded-lg p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{request.request_number}</h2>
            <p className="text-sm text-gray-600">{request.supplier?.name}</p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColor.text}`}>
            <StatusIcon className="w-4 h-4" />
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-300">
          <div>
            <p className="text-xs font-medium text-gray-600">Request Date</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {new Date(request.requested_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">Total Amount</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              ${Number(request.total_amount || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">Expected Delivery</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {request.expected_delivery_date
                ? new Date(request.expected_delivery_date).toLocaleDateString()
                : 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Order Items ({request.items?.length || 0})</h3>
        </div>

        {request.items && request.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Unit Price</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Quantity Requested</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Quantity Received</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {request.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.product_type.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      {item.quantity_requested}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {request.status === 'received' || request.status === 'approved' ? (
                        item.quantity_received || 0
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      ${(item.quantity_requested * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No items in this order</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {request.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowApproveModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Approve Request
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Reject Request
          </button>
        </div>
      )}

      {request.status === 'approved' && (
        <div>
          <button
            onClick={() => setShowReceiveModal(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Record as Received
          </button>
        </div>
      )}

      {/* Approval/Rejection Notes */}
      {(request.status === 'approved' || request.status === 'rejected') && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <p className="text-gray-700">
            {request.status === 'approved' ? request.approval_notes : request.rejection_reason}
          </p>
        </div>
      )}

      {/* Modals */}
      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Restock Request</h3>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add optional approval notes..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                Confirm Approval
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Restock Request</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                Confirm Rejection
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Received Quantities</h3>

            <div className="space-y-4 mb-6">
              {request.items?.map((item) => (
                <div key={item.id} className="flex items-end gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Requested: {item.quantity_requested}</p>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Received</label>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity_requested}
                      value={receivedQuantities[item.id] || 0}
                      onChange={(e) =>
                        setReceivedQuantities({
                          ...receivedQuantities,
                          [item.id]: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReceive}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                Confirm Receipt
              </button>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

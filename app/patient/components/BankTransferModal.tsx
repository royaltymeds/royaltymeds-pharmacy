'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Upload, AlertCircle, Loader, Check, Image as ImageIcon } from 'lucide-react';
import { PaymentConfig } from '@/lib/types/payments';
import { uploadPaymentReceipt, updateOrderPaymentStatus } from '@/app/actions/payments';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  amount: number;
  bankConfig: PaymentConfig | null;
  onPaymentInitiated: () => void;
}

export function BankTransferModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  bankConfig,
  onPaymentInitiated,
}: BankTransferModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('File must be an image (JPEG, PNG, GIF) or PDF');
        return;
      }
      setSelectedFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a receipt file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Upload receipt
      const receiptUrl = await uploadPaymentReceipt(selectedFile, orderId);

      // Update order payment status
      await updateOrderPaymentStatus(orderId, 'pending', 'bank_transfer', receiptUrl);

      setSuccess(true);
      onPaymentInitiated();

      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setSelectedFile(null);
        setFilePreview('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  if (!bankConfig) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Bank Transfer Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-600">Bank transfer details are not yet configured. Please contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Bank Transfer Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Check className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Receipt Submitted</h3>
              <p className="text-gray-600">
                Your receipt has been uploaded successfully. We will verify your payment and update your order status shortly.
              </p>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Order Number</span>
                  <span className="font-bold text-gray-900">{orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Amount Due</span>
                  <span className="text-2xl font-bold text-green-600">${amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                  Bank Account Details
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 text-sm md:text-base">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1">
                    <span className="text-gray-700 font-medium">Account Holder</span>
                    <span className="text-gray-900 break-all">{bankConfig.bank_account_holder}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1">
                    <span className="text-gray-700 font-medium">Bank Name</span>
                    <span className="text-gray-900">{bankConfig.bank_name}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1">
                    <span className="text-gray-700 font-medium">Account Number</span>
                    <span className="text-gray-900 font-mono">{bankConfig.account_number}</span>
                  </div>
                  {bankConfig.routing_number && (
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1">
                      <span className="text-gray-700 font-medium">Routing Number</span>
                      <span className="text-gray-900 font-mono">{bankConfig.routing_number}</span>
                    </div>
                  )}
                  {bankConfig.iban && (
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1">
                      <span className="text-gray-700 font-medium">IBAN</span>
                      <span className="text-gray-900 font-mono break-all">{bankConfig.iban}</span>
                    </div>
                  )}
                  {bankConfig.swift_code && (
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1">
                      <span className="text-gray-700 font-medium">SWIFT Code</span>
                      <span className="text-gray-900 font-mono">{bankConfig.swift_code}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              {bankConfig.additional_instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
                    Payment Instructions
                  </h4>
                  <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap">
                    {bankConfig.additional_instructions}
                  </p>
                </div>
              )}

              {/* File Upload */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                  Upload Payment Receipt
                </h3>
                
                {/* File Preview */}
                {filePreview && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                    {selectedFile?.type.startsWith('image/') ? (
                      <Image
                        src={filePreview}
                        alt="Receipt preview"
                        width={800}
                        height={256}
                        className="w-full h-64 object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">{selectedFile?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">PDF Document</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600 mb-4">
                    {selectedFile ? selectedFile.name : 'Drag and drop your receipt or click to browse'}
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="receipt-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="receipt-upload">
                    <button
                      type="button"
                      onClick={() => document.getElementById('receipt-upload')?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-xs md:text-sm cursor-pointer disabled:bg-gray-400"
                    >
                      Select File
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPEG, GIF, or PDF • Max 5MB
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex gap-2 text-xs md:text-sm">
                  <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm md:text-base disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm md:text-base disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Submit Receipt'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

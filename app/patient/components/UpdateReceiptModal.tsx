'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Upload, AlertCircle, Loader, Check, FileText } from 'lucide-react';
import { uploadPaymentReceipt, updateOrderPaymentStatus } from '@/app/actions/payments';

interface UpdateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentReceiptUrl: string;
  onReceiptUpdated: () => void;
}

export function UpdateReceiptModal({
  isOpen,
  onClose,
  orderId,
  currentReceiptUrl,
  onReceiptUpdated,
}: UpdateReceiptModalProps) {
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

      // Update order with new receipt URL
      await updateOrderPaymentStatus(orderId, 'pending', 'bank_transfer', receiptUrl);

      setSuccess(true);
      onReceiptUpdated();

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

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Update Receipt</h2>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Receipt Updated</h3>
              <p className="text-gray-600">
                Your receipt has been updated successfully.
              </p>
            </div>
          ) : (
            <>
              {/* Current Receipt Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Current Receipt</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center h-32">
                  {currentReceiptUrl.includes('.pdf') ? (
                    <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-red-500" />
                    </div>
                  ) : (
                    <Image
                      src={currentReceiptUrl}
                      alt="Current payment receipt"
                      width={200}
                      height={128}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={uploading}
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">Choose a file to replace</p>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG, GIF, or PDF (Max 5MB)</p>
                </label>
              </div>

              {/* File Preview */}
              {filePreview && selectedFile && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">New Receipt Preview</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-32">
                    {selectedFile.type === 'application/pdf' ? (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">{selectedFile.name}</p>
                      </div>
                    ) : (
                      <Image
                        src={filePreview}
                        alt="New receipt preview"
                        width={200}
                        height={128}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || uploading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading && <Loader className="w-5 h-5 animate-spin" />}
                {uploading ? 'Uploading...' : 'Update Receipt'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

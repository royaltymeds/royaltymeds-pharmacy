"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { uploadAvatarImage } from "@/app/actions/patient-profile";

interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  street_address_line_1: string | null;
  street_address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientProfileClientProps {
  profile: PatientProfile | null;
  userId: string;
  userEmail: string;
}

export default function PatientProfileClient({
  profile,
  userId,
  userEmail,
}: PatientProfileClientProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a valid image file (JPG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const result = await uploadAvatarImage(formData);

      if (result.success && result.avatarUrl) {
        setCurrentAvatar(result.avatarUrl);
        setAvatarPreview(null);
        setUploadSuccess(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(result.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("An unexpected error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {/* Profile Picture Section */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Profile Picture</h2>

          {/* Current or Preview Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                />
              ) : currentAvatar ? (
                <Image
                  src={currentAvatar}
                  alt="Profile picture"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Upload Buttons */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={isUploading}
            />

            {!avatarPreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium text-sm inline-block"
              >
                Choose Image
              </button>
            )}

            {avatarPreview && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleUploadAvatar}
                  disabled={isUploading}
                  className="w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium text-sm flex items-center gap-2 inline-block"
                >
                  {isUploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setAvatarPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={isUploading}
                  className="w-auto px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:bg-gray-400 transition font-medium text-sm inline-block"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Profile picture updated successfully!</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information Section */}
      <div className="lg:col-span-2 space-y-3 sm:space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.full_name || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">{userEmail}</p>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed after signup</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.date_of_birth ? formatDate(profile.date_of_birth) : "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Contact Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.phone || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.street_address_line_1 || "Not provided"}
              </p>
            </div>

            {profile?.street_address_line_2 && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Street Address (Continued)
                </label>
                <p className="text-sm sm:text-base text-gray-900 py-2">
                  {profile.street_address_line_2}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.city || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Province/State
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.state || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.postal_code || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.country || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Account Created
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.created_at ? formatDate(profile.created_at) : "N/A"}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-sm sm:text-base text-gray-900 py-2">
                {profile?.updated_at ? formatDate(profile.updated_at) : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

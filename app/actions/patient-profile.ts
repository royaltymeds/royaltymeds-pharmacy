"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Create admin client for file operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadAvatarImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    console.log("[uploadAvatarImage] Upload started:", { userId, fileName: file.name, fileSize: file.size });

    if (!file || !userId) {
      return { success: false, error: "Missing file or user ID" };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Please upload a JPG, PNG, GIF, or WebP image." };
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size exceeds 5MB limit" };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${timestamp}.${fileExtension}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase storage
    console.log("[uploadAvatarImage] Uploading to storage:", filePath);
    const { error: uploadError } = await supabaseAdmin.storage
      .from("royaltymeds_storage")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("[uploadAvatarImage] Upload error:", uploadError);
      return { success: false, error: "Failed to upload file to storage" };
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("royaltymeds_storage")
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData?.publicUrl;

    if (!avatarUrl) {
      return { success: false, error: "Failed to get public URL for uploaded file" };
    }

    console.log("[uploadAvatarImage] File uploaded successfully:", { filePath, avatarUrl });

    // Update user_profiles table with avatar_url
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[uploadAvatarImage] Database update error:", updateError);
      return { success: false, error: "Failed to update profile picture" };
    }

    console.log("[uploadAvatarImage] Profile updated successfully");

    // Revalidate the patient profile page
    revalidatePath("/patient/profile");

    return {
      success: true,
      avatarUrl,
      message: "Profile picture uploaded successfully",
    };
  } catch (error) {
    console.error("[uploadAvatarImage] Exception:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

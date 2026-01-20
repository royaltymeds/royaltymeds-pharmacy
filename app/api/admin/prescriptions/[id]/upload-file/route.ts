import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // params available but using prescriptionId from formData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const prescriptionId = formData.get("prescriptionId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${prescriptionId}/${Date.now()}-${file.name}`;
    const filePath = fileName;

    // Upload to Supabase Storage using the same bucket as patient uploads
    const { error: uploadError } = await supabase.storage
      .from("royaltymeds_storage")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from("royaltymeds_storage")
      .getPublicUrl(filePath);

    const fileUrl = publicUrl.publicUrl;

    // Update the prescription's file_url in the database
    const { error: updateError } = await supabase
      .from("prescriptions")
      .update({ file_url: fileUrl })
      .eq("id", prescriptionId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update prescription with new file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded and prescription updated successfully",
      file: {
        path: filePath,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the file" },
      { status: 500 }
    );
  }
}

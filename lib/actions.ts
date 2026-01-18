"use server";

import { revalidatePath } from "next/cache";

export async function revalidatePrescriptionsPath() {
  revalidatePath("/patient/prescriptions");
}

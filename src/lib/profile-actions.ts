"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import { revalidatePath } from "next/cache";
import { validateE164PhoneNumber } from "./phone-utils";

export async function updateProfile(formData: FormData) {
  const userProfile = await requireAuth();
  const supabase = await createClient();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const phoneConsent = formData.get("phoneConsent") === "true";
  const phoneCountryCode = formData.get("phoneCountryCode") as string;

  // Validate phone consent if phone number is provided
  if (phoneNumber && !phoneConsent) {
    return {
      success: false,
      error: "You must agree to be contacted if providing a phone number",
    };
  }

  // Validate phone number format if provided
  if (phoneNumber) {
    const validation = validateE164PhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || "Invalid phone number format",
      };
    }
  }

  const updateData: any = {
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber || null,
    phone_consent: phoneNumber ? phoneConsent : false,
    phone_country_code: phoneCountryCode || "US",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userProfile.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  return {
    success: true,
    error: null,
  };
}

export async function removePhoneNumber() {
  const userProfile = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      phone_number: null,
      phone_consent: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userProfile.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  return {
    success: true,
    error: null,
  };
}

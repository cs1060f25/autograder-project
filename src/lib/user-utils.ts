"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "student" | "ta" | "instructor";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    return null;
  }

  return {
    id: userData.id,
    email: user.email || "",
    first_name: userData.first_name || "",
    last_name: userData.last_name || "",
    role: userData.role as UserRole,
    onboarding_completed: userData.onboarding_completed || false,
    created_at: userData.created_at,
    updated_at: userData.updated_at,
  };
}

export async function requireAuth(): Promise<UserProfile> {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return profile;
}

export async function getDashboardPath(role: UserRole): Promise<string> {
  switch (role) {
    case "student":
      return "/dashboard/student";
    case "ta":
      return "/dashboard/ta";
    case "instructor":
      return "/dashboard/instructor";
    default:
      return "/dashboard/student";
  }
}

export async function requireRole(
  requiredRole: UserRole
): Promise<UserProfile> {
  const profile = await requireAuth();

  if (profile.role !== requiredRole) {
    redirect("/unauthorized");
  }

  return profile;
}

export async function hasRole(
  userProfile: UserProfile,
  requiredRole: UserRole
): Promise<boolean> {
  return userProfile.role === requiredRole;
}

export async function canAccessDashboard(
  userProfile: UserProfile,
  dashboardRole: UserRole
): Promise<boolean> {
  return userProfile.role === dashboardRole;
}

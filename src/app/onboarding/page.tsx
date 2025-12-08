import { AuthLayout } from "@/components/auth/auth-layout";
import { MarketingPanel } from "@/components/auth/marketing-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (userData?.onboarding_completed) {
    redirect("/");
  }

  // Check if user is an OAuth user (Google or GitHub)
  const isOAuthUser =
    user.app_metadata?.provider === "google" ||
    user.app_metadata?.provider === "github" ||
    user.app_metadata?.providers?.includes("google") ||
    user.app_metadata?.providers?.includes("github");

  // Check if first_name or last_name is missing
  const needsNames =
    isOAuthUser && (!userData?.first_name || !userData?.last_name);

  async function completeOnboarding(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const role = formData.get("role") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const phoneCountryCode = formData.get("phoneCountryCode") as string;
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;

    // Check if user is OAuth and needs names
    const isOAuthUser =
      user.app_metadata?.provider === "google" ||
      user.app_metadata?.provider === "github" ||
      user.app_metadata?.providers?.includes("google") ||
      user.app_metadata?.providers?.includes("github");

    const { data: currentUserData } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const needsNames =
      isOAuthUser &&
      (!currentUserData?.first_name || !currentUserData?.last_name);

    // Validate required fields for OAuth users
    if (needsNames) {
      if (!firstName || !lastName) {
        redirect("/onboarding?error=First name and last name are required");
      }
    }

    const updateData: {
      role: string;
      phone_number: string | null;
      phone_country_code: string;
      phone_consent: boolean;
      onboarding_completed: boolean;
      updated_at: string;
      first_name?: string;
      last_name?: string;
    } = {
      role,
      phone_number: phoneNumber || null,
      phone_country_code: phoneCountryCode || "US",
      phone_consent: phoneNumber ? true : false,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Update first_name and last_name if provided (for OAuth users)
    if (needsNames && firstName && lastName) {
      updateData.first_name = firstName;
      updateData.last_name = lastName;
    }

    await supabase.from("users").update(updateData).eq("id", user.id);

    redirect("/");
  }

  return (
    <AuthLayout panel={<MarketingPanel />}>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Autograder!</CardTitle>
          <CardDescription>
            Let's set up your profile to get you started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}
          {needsNames && (
            <Alert className="mb-4">
              Please provide your first and last name to complete your profile.
            </Alert>
          )}
          <OnboardingForm
            completeOnboarding={completeOnboarding}
            needsNames={needsNames}
            userData={userData}
          />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

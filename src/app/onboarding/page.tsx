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

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (userData?.onboarding_completed) {
    redirect("/");
  }

  async function completeOnboarding(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const role = formData.get("role") as string;
    await supabase
      .from("users")
      .update({
        role,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    redirect("/");
  }

  return (
    <AuthLayout panel={<MarketingPanel />}>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to AI-Assisted Grading!</CardTitle>
          <CardDescription>
            Let's set up your profile to get you started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOnboarding} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="role">I am a...</Label>
                <Select name="role" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="ta">Teaching Assistant</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                Complete Setup
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

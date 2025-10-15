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
import { Box, FormControl, InputLabel, MenuItem } from "@mui/material";

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
          <form action={completeOnboarding}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>I am a...</InputLabel>
                  <Select name="role" required label="I am a...">
                    <MenuItem value="instructor">Instructor</MenuItem>
                    <MenuItem value="ta">Teaching Assistant</MenuItem>
                    <MenuItem value="student">Student</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button type="submit" sx={{ width: "100%" }}>
                  Complete Setup
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

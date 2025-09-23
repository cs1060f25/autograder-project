import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth, getDashboardPath } from "@/lib/user-utils";
import { ShieldX, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function UnauthorizedPage() {
  const userProfile = await requireAuth();
  const dashboardPath = await getDashboardPath(userProfile.role);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this dashboard. Your current
            role is:{" "}
            <span className="font-semibold capitalize">{userProfile.role}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              You can only access dashboards that match your assigned role.
            </p>
            <Link href={dashboardPath}>
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Your Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

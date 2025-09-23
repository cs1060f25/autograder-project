"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, UserRole } from "@/lib/user-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  userProfile: UserProfile;
  requiredRole: UserRole;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  userProfile,
  requiredRole,
  fallback,
}: RoleGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user has the required role
    if (userProfile.role !== requiredRole) {
      setIsChecking(false);
      return;
    }
    setIsChecking(false);
  }, [userProfile.role, requiredRole]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 mb-4" />
            <p className="text-gray-600">Checking permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userProfile.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

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
              <span className="font-semibold capitalize">
                {userProfile.role}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                You can only access dashboards that match your assigned role.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Your Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

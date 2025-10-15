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
import {
  Security as ShieldXIcon,
  Refresh as Loader2Icon,
} from "@mui/icons-material";
import { Box, Typography, CircularProgress } from "@mui/material";

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
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "grey.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 448 }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress sx={{ mb: 2, color: "text.secondary" }} />
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Checking permissions...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (userProfile.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "grey.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 448 }}>
          <CardHeader sx={{ textAlign: "center" }}>
            <Box
              sx={{
                mx: "auto",
                mb: 2,
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "error.light",
              }}
            >
              <ShieldXIcon sx={{ fontSize: 32, color: "error.main" }} />
            </Box>
            <CardTitle
              sx={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "text.primary",
              }}
            >
              Access Denied
            </CardTitle>
            <CardDescription sx={{ color: "text.secondary" }}>
              You don't have permission to access this dashboard. Your current
              role is:{" "}
              <Box
                component="span"
                sx={{ fontWeight: 600, textTransform: "capitalize" }}
              >
                {userProfile.role}
              </Box>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "text.disabled", mb: 2 }}
              >
                You can only access dashboards that match your assigned role.
              </Typography>
              <Button onClick={() => router.push("/")} sx={{ width: "100%" }}>
                Go to Your Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}

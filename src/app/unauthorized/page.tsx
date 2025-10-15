import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth, getDashboardPath } from "@/lib/user-utils";
import {
  Security as ShieldXIcon,
  ArrowBack as ArrowLeftIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { Box, Typography } from "@mui/material";

export default async function UnauthorizedPage() {
  const userProfile = await requireAuth();
  const dashboardPath = await getDashboardPath(userProfile.role);

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
            <Typography variant="body2" sx={{ color: "text.disabled", mb: 2 }}>
              You can only access dashboards that match your assigned role.
            </Typography>
            <Link href={dashboardPath}>
              <Button sx={{ width: "100%" }}>
                <ArrowLeftIcon sx={{ mr: 1, fontSize: 16 }} />
                Go to Your Dashboard
              </Button>
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

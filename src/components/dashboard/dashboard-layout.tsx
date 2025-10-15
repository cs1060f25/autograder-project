"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { UserProfile, UserRole } from "@/lib/user-utils";
import {
  MenuBook as BookOpenIcon,
  School as GraduationCapIcon,
  People as UsersIcon,
  Logout as LogOutIcon,
  Person as UserIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { RoleGuard } from "./role-guard";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userProfile: UserProfile;
  title: string;
  description: string;
  requiredRole?: UserRole;
}

export function DashboardLayout({
  children,
  userProfile,
  title,
  description,
  requiredRole,
}: DashboardLayoutProps) {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "instructor":
        return "Instructor";
      case "ta":
        return "Teaching Assistant";
      case "student":
        return "Student";
      default:
        return "User";
    }
  };

  const content = (
    <Box sx={{ minHeight: "100vh", backgroundColor: "grey.50" }}>
      <AppBar
        position="static"
        sx={{ backgroundColor: "background.paper", color: "text.primary" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h6"
              sx={{
                background: "linear-gradient(45deg, #9333ea, #e11d48, #ea580c)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "bold",
              }}
            >
              AI Grading Platform
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ fontWeight: 500 }}>
                {userProfile.first_name} {userProfile.last_name}
              </Box>
              <Box component="span" sx={{ ml: 1, color: "text.disabled" }}>
                ({getRoleDisplayName(userProfile.role)})
              </Box>
            </Typography>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <LogOutIcon sx={{ fontSize: 16 }} />
              Sign Out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{ maxWidth: "7xl", mx: "auto", px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            {title}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, color: "text.secondary" }}>
            {description}
          </Typography>
        </Box>

        {children}
      </Box>
    </Box>
  );

  // If no required role is specified, render content directly
  if (!requiredRole) {
    return content;
  }

  // Otherwise, wrap with role guard
  return (
    <RoleGuard userProfile={userProfile} requiredRole={requiredRole}>
      {content}
    </RoleGuard>
  );
}

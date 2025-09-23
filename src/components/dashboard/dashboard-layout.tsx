"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { UserProfile, UserRole } from "@/lib/user-utils";
import { BookOpen, GraduationCap, Users, LogOut, User } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent font-bold">
                  AI Grading Platform
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {userProfile.first_name} {userProfile.last_name}
                </span>
                <span className="ml-2 text-gray-400">
                  ({getRoleDisplayName(userProfile.role)})
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-lg text-gray-600">{description}</p>
        </div>

        {children}
      </main>
    </div>
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

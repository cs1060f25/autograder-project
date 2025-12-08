"use client";

import { cn } from "@/lib/utils";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { signUp, signInWithGoogle, signInWithGitHub } from "@/lib/auth-actions";
import { Github } from "lucide-react";
import { useState } from "react";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [consentError, setConsentError] = useState("");

  const handlePhoneChange = (value: string, isValid: boolean) => {
    setPhoneNumber(value);
    setPhoneValid(isValid);
    // Clear consent error when phone is removed
    if (!value) {
      setConsentError("");
      setPhoneConsent(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Validate consent if phone number is provided
    if (phoneNumber && !phoneConsent) {
      e.preventDefault();
      setConsentError("You must agree to be contacted if providing a phone number");
      return;
    }
    setConsentError("");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Enter your details below to create your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* OAuth Buttons */}
            <div className="flex flex-col gap-3">
              <form action={signInWithGoogle}>
                <Button type="submit" variant="outline" className="w-full">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </form>
              <form action={signInWithGitHub}>
                <Button type="submit" variant="outline" className="w-full">
                  <Github className="mr-2 h-4 w-4" />
                  Continue with GitHub
                </Button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form action={signUp} onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@college.harvard.edu"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={phoneNumber ? !phoneValid : false}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </form>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline underline-offset-4">
                Sign in
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

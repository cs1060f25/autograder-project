"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { PhoneDisplay } from "@/components/ui/phone-display";
import { UserProfile } from "@/lib/user-utils";
import { updateProfile, removePhoneNumber } from "@/lib/profile-actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { linkGoogleIdentity, linkGitHubIdentity } from "@/lib/auth-actions";
import { Pencil, Trash2 } from "lucide-react";

interface ProfileFormProps {
  userProfile: UserProfile;
  initialSuccessMessage?: string;
  initialErrorMessage?: string;
}

const LINKABLE_PROVIDERS: Array<{
  id: "google" | "github";
  label: string;
  description: string;
  action: () => Promise<void>;
}> = [
  {
    id: "google",
    label: "Google",
    description: "Use your Google account to sign in.",
    action: linkGoogleIdentity,
  },
  {
    id: "github",
    label: "GitHub",
    description: "Use your GitHub account to sign in.",
    action: linkGitHubIdentity,
  },
];

export function ProfileForm({
  userProfile,
  initialSuccessMessage = "",
  initialErrorMessage = "",
}: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(
    userProfile.phone_number || ""
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    userProfile.phone_country_code || "US"
  );
  const [phoneValid, setPhoneValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState(initialSuccessMessage);
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage);
  const linkedProviders = userProfile.linked_providers || [];

  const handlePhoneChange = (value: string, isValid: boolean) => {
    setPhoneNumber(value);
    setPhoneValid(isValid);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    formData.set("phoneNumber", phoneNumber);
    formData.set("phoneCountryCode", phoneCountryCode);

    formData.set("phoneConsent", "true"); // Always set phone consent to true in profile form

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccessMessage("Profile updated successfully");
      setIsEditing(false);
    } else {
      setErrorMessage(result.error || "Failed to update profile");
    }

    setIsSubmitting(false);
  };

  const handleRemovePhone = async () => {
    setIsRemoving(true);
    setSuccessMessage("");
    setErrorMessage("");
    setShowRemoveDialog(false);

    const result = await removePhoneNumber();

    if (result.success) {
      setPhoneNumber("");
      setSuccessMessage("Phone number removed successfully");
    } else {
      setErrorMessage(result.error || "Failed to remove phone number");
    }

    setIsRemoving(false);
  };

  return (
    <div className="max-w-7xl space-y-6">
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your account details and contact information.
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={userProfile.first_name}
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={userProfile.last_name}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userProfile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  Email cannot be changed.
                </p>
              </div>

              {/* Phone Number Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Phone Number
                  </Label>
                  {userProfile.phone_number && !isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRemoveDialog(true)}
                      disabled={isRemoving}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>

                {!isEditing && userProfile.phone_number ? (
                  <div className="space-y-2">
                    <PhoneDisplay
                      phoneNumber={userProfile.phone_number}
                      countryCode={userProfile.phone_country_code}
                      masked={true}
                    />
                  </div>
                ) : !isEditing ? (
                  <div className="text-sm text-gray-500">
                    No phone number on file
                  </div>
                ) : (
                  <PhoneInput
                    id="phone"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    countryCode={phoneCountryCode}
                    onCountryChange={setPhoneCountryCode}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                  />
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting || (phoneNumber ? !phoneValid : false)
                    }
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setPhoneNumber(userProfile.phone_number || "");
                      setErrorMessage("");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        {/* Linked Accounts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Linked Accounts</CardTitle>
            <CardDescription>
              Connect additional login methods to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {LINKABLE_PROVIDERS.map((provider) => {
              const isLinked = linkedProviders.includes(provider.id);
              return (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{provider.label}</span>
                      <span className="text-sm text-gray-500">
                        {provider.description}
                      </span>
                    </div>
                  </div>
                  {isLinked ? (
                    <Badge className="py-2 bg-green-400 text-white">
                      Connected
                    </Badge>
                  ) : (
                    <form action={provider.action}>
                      <Button type="submit" variant="outline" size="sm">
                        Connect
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Remove Phone Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Phone Number</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove your phone number? You will no
              longer receive SMS notifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemovePhone}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

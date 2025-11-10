"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { PhoneDisplay } from "@/components/ui/phone-display";
import { UserProfile } from "@/lib/user-utils";
import { updateProfile, removePhoneNumber } from "@/lib/profile-actions";
import { Alert } from "@/components/ui/alert";
import { Pencil, Trash2 } from "lucide-react";

interface ProfileFormProps {
  userProfile: UserProfile;
}

export function ProfileForm({ userProfile }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phone_number || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(userProfile.phone_country_code || "US");
  const [phoneConsent, setPhoneConsent] = useState(userProfile.phone_consent || false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [consentError, setConsentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePhoneChange = (value: string, isValid: boolean) => {
    setPhoneNumber(value);
    setPhoneValid(isValid);
    if (!value) {
      setConsentError("");
      setPhoneConsent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate consent if phone number is provided
    if (phoneNumber && !phoneConsent) {
      setConsentError("You must agree to be contacted if providing a phone number");
      return;
    }
    
    setConsentError("");
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    formData.set("phoneNumber", phoneNumber);
    formData.set("phoneCountryCode", phoneCountryCode);
    formData.set("phoneConsent", phoneConsent ? "true" : "false");

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccessMessage("Profile updated successfully");
      setIsEditing(false);
      // Refresh the page to get updated data
      window.location.reload();
    } else {
      setErrorMessage(result.error || "Failed to update profile");
    }

    setIsSubmitting(false);
  };

  const handleRemovePhone = async () => {
    if (!confirm("Are you sure you want to remove your phone number?")) {
      return;
    }

    setIsRemoving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const result = await removePhoneNumber();

    if (result.success) {
      setPhoneNumber("");
      setPhoneConsent(false);
      setSuccessMessage("Phone number removed successfully");
      // Refresh the page to get updated data
      window.location.reload();
    } else {
      setErrorMessage(result.error || "Failed to remove phone number");
    }

    setIsRemoving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {successMessage && (
        <Alert variant="success">{successMessage}</Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">{errorMessage}</Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your account details and contact information
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
            {/* Name Fields */}
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
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={userProfile.role}
                disabled
                className="bg-gray-50 capitalize"
              />
            </div>

            {/* Phone Number Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Phone Number</Label>
                {userProfile.phone_number && !isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhone}
                    disabled={isRemoving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isRemoving ? "Removing..." : "Remove"}
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
                  {userProfile.phone_consent && (
                    <p className="text-sm text-gray-500">
                      ✓ Consented to be contacted via phone
                    </p>
                  )}
                </div>
              ) : !isEditing ? (
                <div className="text-sm text-gray-500">
                  No phone number on file
                </div>
              ) : (
                <>
                  <PhoneInput
                    id="phone"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    countryCode={phoneCountryCode}
                    onCountryChange={setPhoneCountryCode}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                    aria-describedby={phoneNumber ? "phone-consent-description" : undefined}
                  />

                  {phoneNumber && isEditing && (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="phoneConsent"
                          checked={phoneConsent}
                          onCheckedChange={(checked: boolean) => {
                            setPhoneConsent(checked === true);
                            if (checked) {
                              setConsentError("");
                            }
                          }}
                          aria-describedby="phone-consent-description"
                          aria-invalid={!!consentError}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="phoneConsent"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            I agree to be contacted via phone
                          </label>
                          <p
                            id="phone-consent-description"
                            className="text-sm text-gray-500"
                          >
                            By checking this box, you consent to receive communications from us at the phone number provided. Message and data rates may apply.
                          </p>
                        </div>
                      </div>
                      {consentError && (
                        <p className="text-sm text-red-500" role="alert" aria-live="polite">
                          {consentError}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || (phoneNumber ? !phoneValid : false)}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setPhoneNumber(userProfile.phone_number || "");
                    setPhoneConsent(userProfile.phone_consent || false);
                    setConsentError("");
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
    </div>
  );
}

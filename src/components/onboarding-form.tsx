"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { useState } from "react";

interface OnboardingFormProps {
  completeOnboarding: (formData: FormData) => Promise<void>;
  needsNames: boolean;
  userData: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

export function OnboardingForm({
  completeOnboarding,
  needsNames,
  userData,
}: OnboardingFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneValid, setPhoneValid] = useState(true);

  const handlePhoneChange = (value: string, isValid: boolean) => {
    setPhoneNumber(value);
    setPhoneValid(isValid);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    formData.set("phoneNumber", phoneNumber);
    formData.set("phoneCountryCode", phoneCountryCode);

    await completeOnboarding(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {needsNames && (
          <>
            <div className="grid gap-3">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="Enter your first name"
                required
                defaultValue={userData?.first_name || ""}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Enter your last name"
                required
                defaultValue={userData?.last_name || ""}
              />
            </div>
          </>
        )}
        <div className="grid gap-3">
          <Label htmlFor="role">I am a...</Label>
          <Select name="role" required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="ta">Teaching Assistant</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="phone">Phone Number (optional)</Label>
          <PhoneInput
            id="phone"
            name="phoneNumber"
            value={phoneNumber}
            onChange={handlePhoneChange}
            countryCode={phoneCountryCode}
            onCountryChange={setPhoneCountryCode}
            placeholder="Enter your phone number"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          className="w-full"
          disabled={phoneNumber ? !phoneValid : false}
        >
          Complete Setup
        </Button>
      </div>
    </form>
  );
}



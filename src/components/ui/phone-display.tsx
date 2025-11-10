"use client";

import * as React from "react";
import { maskPhoneNumber, formatPhoneNumber } from "@/lib/phone-utils";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

export interface PhoneDisplayProps {
  phoneNumber: string;
  countryCode?: string;
  masked?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function PhoneDisplay({
  phoneNumber,
  countryCode = "US",
  masked = true,
  showIcon = true,
  className,
}: PhoneDisplayProps) {
  if (!phoneNumber) {
    return null;
  }

  const displayNumber = masked
    ? maskPhoneNumber(phoneNumber)
    : formatPhoneNumber(phoneNumber, countryCode);

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {showIcon && <Phone className="h-4 w-4 text-gray-500" />}
      <span className="font-mono">{displayNumber}</span>
    </div>
  );
}

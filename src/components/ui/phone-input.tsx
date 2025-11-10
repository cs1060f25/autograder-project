"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COUNTRY_CODES,
  validateE164PhoneNumber,
  validatePhoneLength,
  toE164Format,
  formatPhoneNumber,
} from "@/lib/phone-utils";
import { cn } from "@/lib/utils";

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string, isValid: boolean) => void;
  onBlur?: () => void;
  countryCode?: string;
  onCountryChange?: (countryCode: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = "",
      onChange,
      onBlur,
      countryCode = "US",
      onCountryChange,
      error,
      disabled = false,
      required = false,
      id = "phone",
      name = "phone",
      placeholder,
      className,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState(value);
    const [localError, setLocalError] = React.useState<string | undefined>(error);
    const [touched, setTouched] = React.useState(false);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    React.useEffect(() => {
      setLocalError(error);
    }, [error]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setLocalValue(inputValue);

      if (!inputValue) {
        setLocalError(undefined);
        onChange?.("", true);
        return;
      }

      // Validate as user types
      const e164Value = toE164Format(inputValue, countryCode);
      const e164Validation = validateE164PhoneNumber(e164Value);
      const lengthValidation = validatePhoneLength(inputValue, countryCode);

      if (!e164Validation.isValid) {
        setLocalError(e164Validation.error);
        onChange?.(e164Value, false);
      } else if (!lengthValidation.isValid) {
        setLocalError(lengthValidation.error);
        onChange?.(e164Value, false);
      } else {
        setLocalError(undefined);
        onChange?.(e164Value, true);
      }
    };

    const handleBlur = () => {
      setTouched(true);
      onBlur?.();
    };

    const handleCountryChange = (newCountryCode: string) => {
      onCountryChange?.(newCountryCode);
      
      // Re-validate with new country code
      if (localValue) {
        const e164Value = toE164Format(localValue, newCountryCode);
        const lengthValidation = validatePhoneLength(localValue, newCountryCode);
        
        if (!lengthValidation.isValid) {
          setLocalError(lengthValidation.error);
          onChange?.(e164Value, false);
        } else {
          setLocalError(undefined);
          onChange?.(e164Value, true);
        }
      }
    };

    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);
    const displayPlaceholder = placeholder || selectedCountry?.format || "Enter phone number";

    const showError = touched && localError;

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex gap-2">
          <div className="w-[180px]">
            <Select
              value={countryCode}
              onValueChange={handleCountryChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={`${id}-country`}
                aria-label="Select country code"
                className={cn(showError && "border-red-500")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.dialCode} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              ref={ref}
              id={id}
              name={name}
              type="tel"
              value={localValue}
              onChange={handlePhoneChange}
              onBlur={handleBlur}
              placeholder={displayPlaceholder}
              disabled={disabled}
              required={required}
              aria-label={ariaLabel || "Phone number"}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid || !!showError}
              className={cn(showError && "border-red-500")}
            />
          </div>
        </div>
        {showError && (
          <p
            id={`${id}-error`}
            className="text-sm text-red-500"
            role="alert"
            aria-live="polite"
          >
            {localError}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

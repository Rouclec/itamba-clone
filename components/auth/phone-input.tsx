"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { countries, defaultCountry, type Country } from "@/lib/countries";
import { toFullNumber, parsePhone, formatNational } from "@/utils/phone";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onCountryChange?: (country: Country) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Initial country (e.g. from signupRequest.phoneNumber). If not set, uses defaultCountry (Cameroon). */
  defaultCountryCode?: string;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  onCountryChange,
  error,
  placeholder = "677 777 777",
  required = false,
  disabled = false,
  defaultCountryCode,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    if (defaultCountryCode) {
      const found = countries.find(
        (c) =>
          c.code === defaultCountryCode || c.dial_code === defaultCountryCode,
      );
      if (found) return found;
    }
    return defaultCountry;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    onChange("");
    onCountryChange?.(country);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = input.replace(/\D/g, "");
    onChange(cleaned);
  };

  const formatPhoneDisplay = (digits: string) => {
    if (!digits) return "";
    const full = toFullNumber(selectedCountry.dial_code, digits);
    const parsed = parsePhone(full);
    if (parsed?.isValid()) return formatNational(parsed);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Phone number
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      <div
        className={`flex items-stretch h-[40px] border rounded-lg overflow-visible transition-colors border-(--input-border) ${
          disabled ? "bg-muted pointer-events-none opacity-90" : ""
        } ${
          error
            ? "border-destructive bg-red-50"
            : "bg-white hover:border-primary/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
        }`}
      >
        {/* Country Code Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => !disabled && setIsOpen(!isOpen)}
            type="button"
            disabled={disabled}
            className="px-3 py-0 h-full flex items-center gap-2 rounded-l-lg hover:bg-(--hover) min-w-28 shrink-0 disabled:pointer-events-none"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label="Select country"
          >
            <span className="text-lg" aria-hidden>
              {selectedCountry.emoji}
            </span>
            <span className="text-sm font-medium text-foreground">
              {selectedCountry.dial_code}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu - scrollable list */}
          {isOpen && (
            <div
              className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 min-w-64 max-h-64 overflow-y-auto"
              role="listbox"
            >
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  type="button"
                  role="option"
                  aria-selected={selectedCountry.code === country.code}
                  className={`w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-2 border-b border-border last:border-b-0 transition-colors ${
                    selectedCountry.code === country.code ? "bg-muted/30" : ""
                  }`}
                >
                  <span className="text-lg shrink-0">{country.emoji}</span>
                  <span className="flex-1 text-sm text-foreground truncate">
                    {country.name}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {country.dial_code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input - national number only (no extension in placeholder) */}
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formatPhoneDisplay(value)}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={15}
          className="flex-1 min-w-0 h-full px-4 py-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// src/components/common/PasswordStrengthIndicator.tsx
// Reusable password strength indicator component
// Shows real-time feedback on password strength and requirements

"use client";

import React from "react";
import {
  validatePassword,
  getPasswordRequirements,
  type PasswordValidationResult,
} from "@/lib/utils/passwordValidator";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

/**
 * Props for PasswordStrengthIndicator component
 */
interface PasswordStrengthIndicatorProps {
  password: string; // The password to validate and display strength for
  showRequirements?: boolean; // Whether to show detailed requirements checklist (default: true)
  showStrengthBar?: boolean; // Whether to show visual strength bar (default: true)
  className?: string; // Additional CSS classes for container
}

/**
 * PasswordStrengthIndicator Component
 *
 * Displays real-time password strength feedback with:
 * - Color-coded strength bar (weak/medium/strong)
 * - Detailed requirements checklist with pass/fail icons
 * - Helpful error messages and suggestions
 *
 * @example
 * <PasswordStrengthIndicator
 *   password={formData.password}
 *   showRequirements={true}
 *   showStrengthBar={true}
 * />
 */
export default function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  showStrengthBar = true,
  className = "",
}: PasswordStrengthIndicatorProps) {
  // Validate password and get results
  const validation: PasswordValidationResult = validatePassword(password);

  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  // Get color based on strength
  const getStrengthColor = () => {
    switch (validation.strength) {
      case "strong":
        return {
          bg: "bg-green-500",
          text: "text-green-700",
          lightBg: "bg-green-50",
          border: "border-green-200",
        };
      case "medium":
        return {
          bg: "bg-yellow-500",
          text: "text-yellow-700",
          lightBg: "bg-yellow-50",
          border: "border-yellow-200",
        };
      case "weak":
        return {
          bg: "bg-red-500",
          text: "text-red-700",
          lightBg: "bg-red-50",
          border: "border-red-200",
        };
    }
  };

  const colors = getStrengthColor();

  // Get strength label
  const getStrengthLabel = () => {
    switch (validation.strength) {
      case "strong":
        return "Strong Password";
      case "medium":
        return "Medium Password";
      case "weak":
        return "Weak Password";
    }
  };

  // Get strength percentage for progress bar
  const getStrengthPercentage = () => {
    switch (validation.strength) {
      case "strong":
        return 100;
      case "medium":
        return 60;
      case "weak":
        return 30;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      {showStrengthBar && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${colors.text}`}>
              {getStrengthLabel()}
            </span>
            <span className="text-gray-500">
              {validation.errors.length === 0
                ? "All requirements met"
                : `${validation.errors.length} requirement${
                    validation.errors.length > 1 ? "s" : ""
                  } not met`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${colors.bg} transition-all duration-300 ease-out`}
              style={{ width: `${getStrengthPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <div
          className={`p-3 rounded-lg border ${colors.lightBg} ${colors.border}`}
        >
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Password Requirements:
          </p>
          <ul className="space-y-1">
            {getPasswordRequirements().map((requirement, index) => {
              // ✅ FIXED: Check if this specific requirement is met
              // Map each requirement to its validation check
              let isMet = false;

              if (requirement.includes("8 characters")) {
                // Length requirement
                isMet = password.length >= 8;
              } else if (requirement.includes("uppercase")) {
                // Uppercase letter requirement
                isMet = /[A-Z]/.test(password);
              } else if (requirement.includes("lowercase")) {
                // Lowercase letter requirement
                isMet = /[a-z]/.test(password);
              } else if (requirement.includes("number")) {
                // Number requirement
                isMet = /[0-9]/.test(password);
              } else if (requirement.includes("special character")) {
                // Special character requirement
                isMet = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);
              }

              return (
                <li key={index} className="flex items-start space-x-2 text-xs">
                  {isMet ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`${isMet ? "text-green-700" : "text-gray-600"} ${
                      isMet ? "line-through" : ""
                    }`}
                  >
                    {requirement}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Show first error message if any */}
          {validation.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-red-600 font-medium">
                ⚠️ {validation.errors[0]}
              </p>
            </div>
          )}

          {/* Show success message when all requirements met */}
          {validation.isValid && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <p className="text-xs text-green-600 font-medium flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Great! Your password meets all requirements.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version of password strength indicator
 * Shows only strength bar without detailed requirements
 * Useful for constrained spaces
 *
 * @example
 * <PasswordStrengthIndicatorCompact password={formData.password} />
 */
export function PasswordStrengthIndicatorCompact({
  password,
  className = "",
}: {
  password: string;
  className?: string;
}) {
  return (
    <PasswordStrengthIndicator
      password={password}
      showRequirements={false}
      showStrengthBar={true}
      className={className}
    />
  );
}

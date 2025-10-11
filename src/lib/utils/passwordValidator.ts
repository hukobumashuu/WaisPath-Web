// src/lib/utils/passwordValidator.ts
// Centralized password validation utility for WAISPATH admin system
// Ensures consistent password requirements across the entire application

/**
 * Password validation result interface
 * Returns detailed information about password strength
 */
export interface PasswordValidationResult {
  isValid: boolean; // Whether password meets all requirements
  errors: string[]; // Array of error messages for failed validations
  strength: "weak" | "medium" | "strong"; // Overall password strength
  suggestions: string[]; // Helpful suggestions to improve password
}

/**
 * Password requirements constants
 * These are enforced across all password validation in the system
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8, // Minimum 8 characters (industry standard)
  REQUIRE_UPPERCASE: true, // Must have at least one uppercase letter (A-Z)
  REQUIRE_LOWERCASE: true, // Must have at least one lowercase letter (a-z)
  REQUIRE_NUMBER: true, // Must have at least one number (0-9)
  REQUIRE_SPECIAL_CHAR: true, // Must have at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
} as const;

/**
 * Regular expressions for password validation
 */
const PASSWORD_REGEX = {
  UPPERCASE: /[A-Z]/, // Checks for uppercase letters
  LOWERCASE: /[a-z]/, // Checks for lowercase letters
  NUMBER: /[0-9]/, // Checks for numbers
  SPECIAL_CHAR: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, // Checks for special characters
};

/**
 * Main password validation function
 * Validates a password against all requirements and returns detailed feedback
 *
 * @param password - The password string to validate
 * @returns PasswordValidationResult with validation status and feedback
 *
 * @example
 * const result = validatePassword("MyPass123!");
 * if (!result.isValid) {
 *   console.log(result.errors); // ["Password must contain..."]
 * }
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check if password is provided
  if (!password) {
    return {
      isValid: false,
      errors: ["Password is required"],
      strength: "weak",
      suggestions: ["Please enter a password"],
    };
  }

  // Validation 1: Minimum length
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`
    );
    suggestions.push(
      `Add ${
        PASSWORD_REQUIREMENTS.MIN_LENGTH - password.length
      } more character(s)`
    );
  }

  // Validation 2: Uppercase letter
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE &&
    !PASSWORD_REGEX.UPPERCASE.test(password)
  ) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
    suggestions.push("Add an uppercase letter like 'A', 'B', or 'C'");
  }

  // Validation 3: Lowercase letter
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE &&
    !PASSWORD_REGEX.LOWERCASE.test(password)
  ) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
    suggestions.push("Add a lowercase letter like 'a', 'b', or 'c'");
  }

  // Validation 4: Number
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_NUMBER &&
    !PASSWORD_REGEX.NUMBER.test(password)
  ) {
    errors.push("Password must contain at least one number (0-9)");
    suggestions.push("Add a number like '1', '2', or '3'");
  }

  // Validation 5: Special character
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHAR &&
    !PASSWORD_REGEX.SPECIAL_CHAR.test(password)
  ) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
    );
    suggestions.push("Add a special character like '!', '@', or '#'");
  }

  // Calculate password strength
  const strength = calculatePasswordStrength(password, errors.length);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    suggestions: errors.length > 0 ? suggestions : ["Your password is strong!"],
  };
}

/**
 * Quick validation function for forms
 * Returns true if password is valid, false otherwise
 * Use this for simple boolean checks without detailed feedback
 *
 * @param password - The password to validate
 * @returns boolean indicating if password is valid
 *
 * @example
 * if (!isPasswordValid(formData.password)) {
 *   toast.error("Password doesn't meet requirements");
 * }
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Get formatted error message for display
 * Combines all errors into a single readable message
 *
 * @param password - The password to validate
 * @returns Formatted error message or null if valid
 *
 * @example
 * const errorMsg = getPasswordErrorMessage(password);
 * if (errorMsg) {
 *   toast.error(errorMsg);
 * }
 */
export function getPasswordErrorMessage(password: string): string | null {
  const result = validatePassword(password);
  if (result.isValid) return null;

  // Return first error for brevity in UI
  return result.errors[0];
}

/**
 * Get all password requirements as readable text
 * Useful for displaying requirements to users
 *
 * @returns Array of requirement strings
 *
 * @example
 * const requirements = getPasswordRequirements();
 * requirements.forEach(req => console.log(`• ${req}`));
 */
export function getPasswordRequirements(): string[] {
  const requirements: string[] = [
    `At least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`,
  ];

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE) {
    requirements.push("At least one uppercase letter (A-Z)");
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE) {
    requirements.push("At least one lowercase letter (a-z)");
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER) {
    requirements.push("At least one number (0-9)");
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHAR) {
    requirements.push("At least one special character (!@#$%^&*_+)");
  }

  return requirements;
}

/**
 * Calculate password strength based on criteria met
 * Internal helper function
 *
 * @param password - The password to evaluate
 * @param errorCount - Number of validation errors
 * @returns Strength rating: weak, medium, or strong
 */
function calculatePasswordStrength(
  password: string,
  errorCount: number
): "weak" | "medium" | "strong" {
  // If there are errors, it's weak
  if (errorCount > 0) return "weak";

  // Check additional strength factors
  let strengthScore = 0;

  // Length bonus
  if (password.length >= 12) strengthScore += 2;
  else if (password.length >= 10) strengthScore += 1;

  // Character variety bonus
  if (PASSWORD_REGEX.UPPERCASE.test(password)) strengthScore += 1;
  if (PASSWORD_REGEX.LOWERCASE.test(password)) strengthScore += 1;
  if (PASSWORD_REGEX.NUMBER.test(password)) strengthScore += 1;
  if (PASSWORD_REGEX.SPECIAL_CHAR.test(password)) strengthScore += 1;

  // Multiple numbers or special characters
  if ((password.match(/[0-9]/g) || []).length >= 2) strengthScore += 1;
  if ((password.match(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/g) || []).length >= 2) {
    strengthScore += 1;
  }

  // Determine strength level
  if (strengthScore >= 7) return "strong";
  if (strengthScore >= 5) return "medium";
  return "weak";
}

/**
 * Generate a strong random password
 * Useful for temporary password generation
 * Always meets all password requirements
 *
 * @param length - Desired password length (default: 12)
 * @returns A randomly generated strong password
 *
 * @example
 * const tempPassword = generateStrongPassword();
 * // Returns something like: "Kp9@mX2#nQ5!"
 */
export function generateStrongPassword(length: number = 12): string {
  // Ensure minimum length
  if (length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    length = PASSWORD_REQUIREMENTS.MIN_LENGTH;
  }

  // Character sets
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excluded confusing chars: I, O
  const lowercase = "abcdefghijkmnpqrstuvwxyz"; // Excluded confusing chars: l, o
  const numbers = "23456789"; // Excluded confusing chars: 0, 1
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Build password ensuring all requirements are met
  let password = "";

  // Add at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length with random characters from all sets
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to randomize position of required characters
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Check if two passwords match
 * Helper for confirm password fields
 *
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns boolean indicating if passwords match
 *
 * @example
 * if (!passwordsMatch(newPassword, confirmPassword)) {
 *   toast.error("Passwords do not match");
 * }
 */
export function passwordsMatch(
  password: string,
  confirmPassword: string
): boolean {
  return password === confirmPassword && password.length > 0;
}

/**
 * Interface for password strength evaluation results
 */
export interface PasswordStrength {
  hasMinLen: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  score: number;
  percent: number;
  label: string;
  barClass: string;
}

/**
 * Evaluates password strength based on multiple criteria
 * 
 * Mandatory criteria:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 digit
 * 
 * Recommended criteria:
 * - At least 1 special character
 * 
 * @param password - The password to evaluate
 * @returns PasswordStrength object with checks, score, and UI properties
 */
export function evaluatePassword(password: string): PasswordStrength {
  // Criteria checks
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':",.<>\/\?\\|]/.test(password);

  // Calculate score (0-4)
  const score = [hasMinLen, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  // Calculate percentage for progress bar
  const percent = (score / 4) * 100;

  // Determine strength label and color
  let label = 'Faible';
  let barClass = 'bg-red-500';

  if (score >= 3) {
    label = 'Fort';
    barClass = 'bg-green-500';
  } else if (score >= 2) {
    label = 'Moyen';
    barClass = 'bg-orange-500';
  }

  return {
    hasMinLen,
    hasUpper,
    hasDigit,
    hasSpecial,
    score,
    percent,
    label,
    barClass,
  };
}

/**
 * Checks if password meets mandatory criteria
 * 
 * @param password - The password to validate
 * @returns true if password is strong enough (mandatory criteria met)
 */
export function isPasswordValid(password: string): boolean {
  const strength = evaluatePassword(password);
  return strength.hasMinLen && strength.hasUpper && strength.hasDigit;
}

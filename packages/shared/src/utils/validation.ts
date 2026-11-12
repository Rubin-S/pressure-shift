import { z } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] };

/**
 * Safely parses data using a Zod schema, returning a uniform success or error structure.
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const formattedError = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return {
    success: false,
    error: formattedError,
    issues: result.error.issues,
  };
}

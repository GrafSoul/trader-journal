import { z } from 'zod';

// ==================== AUTH VALIDATION SCHEMAS ====================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid'),
  password: z
    .string()
    .min(1, 'validation.passwordRequired'),
});

export const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, 'validation.displayNameMin')
    .max(50, 'validation.displayNameMax'),
  email: z
    .string()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid'),
  password: z
    .string()
    .min(1, 'validation.passwordRequired')
    .min(8, 'validation.passwordMin')
    .regex(/[A-Z]/, 'validation.passwordUppercase')
    .regex(/[a-z]/, 'validation.passwordLowercase')
    .regex(/[0-9]/, 'validation.passwordNumber')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'validation.passwordSymbol'),
  confirmPassword: z
    .string()
    .min(1, 'validation.confirmPasswordRequired'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMismatch',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'validation.passwordRequired')
    .min(8, 'validation.passwordMin')
    .regex(/[A-Z]/, 'validation.passwordUppercase')
    .regex(/[a-z]/, 'validation.passwordLowercase')
    .regex(/[0-9]/, 'validation.passwordNumber')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'validation.passwordSymbol'),
  confirmPassword: z
    .string()
    .min(1, 'validation.confirmPasswordRequired'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMismatch',
  path: ['confirmPassword'],
});

// ==================== TYPES ====================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

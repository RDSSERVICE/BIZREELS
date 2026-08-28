/** Zod validation schemas for auth forms. */

import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must include a special character');

// ---------------------------------------------------------------------------
// Email registration
// ---------------------------------------------------------------------------
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: passwordSchema,
  role: z.enum(['customer', 'vendor', 'creator']).optional().default('customer'),
  interests: z.array(z.object({ category: z.string(), subcategory: z.string().nullable().optional() })).optional(),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Phone registration (name + phone + email + password — email required by server)
// ---------------------------------------------------------------------------
export const registerWithPhoneSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number (e.g. +919876543210)'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: passwordSchema,
  role: z.enum(['customer', 'vendor', 'creator']).optional().default('customer'),
});

export type RegisterWithPhoneFormValues = z.infer<typeof registerWithPhoneSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

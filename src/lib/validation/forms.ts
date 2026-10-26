import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .max(254, 'Email is too long')
  .email('Enter a valid email address')

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer')

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name').max(80, 'Name must be 80 characters or fewer'),
    email,
    password,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: 'The two passwords do not match.',
    path: ['confirm'],
  })

export const forgotPasswordSchema = z.object({ email })

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((value) => value.password === value.confirm, {
    message: 'The two passwords do not match.',
    path: ['confirm'],
  })

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be 100 characters or fewer')

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Please check the form and try again.'
}
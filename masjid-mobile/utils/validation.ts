import { z } from 'zod';

export const emailSchema = z.string().min(1, 'Email is required').email('Invalid email format');

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

export const optionalNameSchema = z
  .string()
  .max(100, 'Name must be less than 100 characters')
  .optional()
  .or(z.literal(''));

export const dateSchema = z.string().min(1, 'Date is required');

export const requiredStringSchema = (fieldName: string, minLength = 1) =>
  z.string().min(minLength, `${fieldName} is required`);

export const minLengthSchema = (fieldName: string, min: number) =>
  z.string().min(min, `${fieldName} must be at least ${min} characters`);

export const maxLengthSchema = (fieldName: string, max: number) =>
  z.string().max(max, `${fieldName} must be less than ${max} characters`);

export const urlSchema = z.string().url('Invalid URL').optional().or(z.literal(''));

export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code format')
  .optional()
  .or(z.literal(''));

export const gradeLevelSchema = z.enum([
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
]);

export const contactMethodSchema = z.enum(['email', 'phone', 'text', 'both']);

export const priceTypeSchema = z.enum(['hourly', 'daily']);

export function validateField<T>(schema: z.ZodType<T>, value: T): string | null {
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.issues[0]?.message || 'Validation error';
  }
  return null;
}

export function validateForm<T>(
  schema: z.ZodType<T>,
  data: T
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

export const studentEnrollmentSchema = z.object({
  studentName: nameSchema,
  dateOfBirth: dateSchema,
  gradeLevel: gradeLevelSchema,
  parentName: nameSchema,
  parentEmail: emailSchema,
  parentPhone: phoneSchema,
  programName: z.string().min(1, 'Please select a program'),
  notes: z.string().max(1000).optional(),
  emergencyContactName: optionalNameSchema,
  emergencyContactPhone: phoneSchema.optional().or(z.literal('')),
  emergencyRelation: optionalNameSchema,
  parentPreferredContact: contactMethodSchema,
});

export const rentalBookingSchema = z.object({
  renterName: nameSchema,
  renterEmail: emailSchema,
  renterPhone: phoneSchema,
  eventName: z.string().max(200).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  priceType: priceTypeSchema,
});

export const jobApplicationSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  position: z.string().min(1, 'Please select a position'),
  experience: z.string().min(1, 'Experience is required'),
  coverLetter: z.string().max(2000).optional(),
});

export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
});

export const donationSchema = z.object({
  amount: z.number().min(1, 'Donation amount is required'),
  campaignId: z.string().min(1, 'Please select a campaign'),
  isRecurring: z.boolean(),
  donorName: nameSchema,
  donorEmail: emailSchema,
  isAnonymous: z.boolean(),
});

export const proposalSchema = z.object({
  title: z.string().min(1, 'Title is required').min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').min(20, 'Please provide at least 20 characters of detail'),
  category: z.string().min(1, 'Category is required'),
});

export type StudentEnrollmentData = z.infer<typeof studentEnrollmentSchema>;
export type RentalBookingData = z.infer<typeof rentalBookingSchema>;
export type JobApplicationData = z.infer<typeof jobApplicationSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type DonationData = z.infer<typeof donationSchema>;
export type ProposalData = z.infer<typeof proposalSchema>;

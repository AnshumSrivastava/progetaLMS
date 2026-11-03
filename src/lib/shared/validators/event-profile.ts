import { z } from 'zod';

export const eventProfileSchema = z.object({
	phone: z
		.string()
		.trim()
		.regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
	organization: z
		.string()
		.trim()
		.min(2, 'Organization / College name must be at least 2 characters')
		.max(120, 'Organization name too long'),
	jobTitle: z
		.string()
		.trim()
		.min(2, 'Role / Designation is required')
		.max(100, 'Role too long'),
	experienceLevel: z.enum(['student', 'fresher', '1-3yrs', '3-5yrs', '5+yrs'], {
		errorMap: () => ({ message: 'Please select your experience level' })
	}),
	city: z.string().trim().min(2, 'City is required').max(60),
	state: z.string().trim().min(2, 'State is required').max(60),
	linkedinUrl: z
		.string()
		.trim()
		.url('Please enter a valid LinkedIn URL')
		.regex(/linkedin\.com\/.+/i, 'Must be a valid LinkedIn profile URL')
		.optional()
		.or(z.literal('')),
	githubUrl: z
		.string()
		.trim()
		.url('Please enter a valid URL')
		.optional()
		.or(z.literal('')),
	dietaryPreference: z.string().trim().max(80).optional().or(z.literal('')),
	emergencyContact: z.string().trim().max(100).optional().or(z.literal(''))
});

export type EventProfileInput = z.infer<typeof eventProfileSchema>;


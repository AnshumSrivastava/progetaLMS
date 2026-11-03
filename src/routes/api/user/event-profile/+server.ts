import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { userEventProfiles } from '$lib/server/db/schema/events.schema';
import { eventProfileSchema } from '$lib/shared/validators/event-profile';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const [profile] = await db
		.select()
		.from(userEventProfiles)
		.where(eq(userEventProfiles.userId, locals.user.id));

	return json({
		hasProfile: !!profile,
		profile: profile || null
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON payload');
	}

	const parsed = eventProfileSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{
				error: 'VALIDATION_FAILED',
				issues: parsed.error.issues
			},
			{ status: 422 }
		);
	}

	const data = parsed.data;

	const [saved] = await db
		.insert(userEventProfiles)
		.values({
			id: createId(),
			userId: locals.user.id,
			phone: data.phone,
			organization: data.organization,
			jobTitle: data.jobTitle,
			experienceLevel: data.experienceLevel,
			city: data.city,
			state: data.state,
			linkedinUrl: data.linkedinUrl || null,
			githubUrl: data.githubUrl || null,
			dietaryPreference: data.dietaryPreference || null,
			emergencyContact: data.emergencyContact || null,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: userEventProfiles.userId,
			set: {
				phone: data.phone,
				organization: data.organization,
				jobTitle: data.jobTitle,
				experienceLevel: data.experienceLevel,
				city: data.city,
				state: data.state,
				linkedinUrl: data.linkedinUrl || null,
				githubUrl: data.githubUrl || null,
				dietaryPreference: data.dietaryPreference || null,
				emergencyContact: data.emergencyContact || null,
				updatedAt: new Date()
			}
		})
		.returning();

	return json({
		success: true,
		profile: saved
	});
};


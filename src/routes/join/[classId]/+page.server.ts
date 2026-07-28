import { db } from '$lib/server/db/client';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { error, fail } from '@sveltejs/kit';
import { eq, and, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [cohort] = await db.select({
    id: cohorts.id,
    name: cohorts.name,
    courseId: cohorts.courseId,
    courseTitle: assets.title,
    instructorName: users.name,
    isActive: cohorts.isActive,
    maxStudents: cohorts.maxStudents
  })
  .from(cohorts)
  .leftJoin(assets, eq(cohorts.courseId, assets.id))
  .leftJoin(users, eq(cohorts.instructorId, users.id))
  .where(eq(cohorts.id, params.classId));

  if (!cohort) throw error(404, 'Class not found');
  if (!cohort.isActive) throw error(410, 'This class is no longer accepting new members');

  return { cohort };
};

export const actions: Actions = {
  enroll: async ({ params, locals }) => {
    if (!locals.user) return fail(401, { error: 'You must be signed in' });

    const cohortId = params.classId;
    const userId = locals.user.id;

    // Verify cohort exists and is active
    const [cohort] = await db.select().from(cohorts)
      .where(and(eq(cohorts.id, cohortId), eq(cohorts.isActive, true)));
    if (!cohort) return fail(404, { error: 'Class not found or inactive' });

    // Check maxStudents limit
    if (cohort.maxStudents) {
      const [{ count }] = await db.select({ count: sql`count(*)` })
        .from(cohortMemberships).where(eq(cohortMemberships.cohortId, cohortId));
      if (Number(count) >= cohort.maxStudents) {
        return fail(400, { error: 'This class is full' });
      }
    }

    // Insert membership (idempotent)
    await db.insert(cohortMemberships).values({
      id: createId(), cohortId, userId, role: 'student'
    }).onConflictDoNothing();

    // Also grant asset ownership
    if (cohort.courseId) {
      await db.insert(assetOwnership).values({
        id: createId(), assetId: cohort.courseId, ownerId: userId, source: 'grant', orderId: null
      }).onConflictDoNothing();
    }

    return { success: true };
  }
};

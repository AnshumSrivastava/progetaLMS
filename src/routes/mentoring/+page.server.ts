import { db } from '$lib/server/db/client';
import { users, identityProfiles } from '$lib/server/db/schema/identity.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Fetch instructors who have a profile and at least one published course
  const mentorsData = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    bio: identityProfiles.bio,
    avatarUrl: identityProfiles.avatarUrl,
    courseCount: sql<number>`count(distinct ${assets.id})`,
  })
  .from(users)
  .leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
  .leftJoin(assets, and(eq(assets.ownerId, users.id), eq(assets.status, 'published')))
  .where(eq(users.role, 'instructor'))
  .groupBy(users.id, identityProfiles.bio, identityProfiles.avatarUrl)
  .having(sql`count(distinct ${assets.id}) > 0`);

  return { mentors: mentorsData };
};

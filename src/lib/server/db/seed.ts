/**
 * Database Seed Script
 *
 * Run: npx tsx src/lib/server/db/seed.ts
 *
 * Seeds:
 * 1. Default roles: student, instructor, super_admin
 * 2. All capability records from the registry
 * 3. Role ↔ capability assignments per ROLE_CAPABILITY_MAP
 *
 * This is idempotent — safe to run multiple times.
 * Uses upsert (onConflictDoNothing) so it won't fail if data exists.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index';
import { eq } from 'drizzle-orm';
import { ALL_CAPABILITIES, ROLE_CAPABILITY_MAP, type CapabilityKey } from '../authorization/capabilities';
import { createId } from '@paralleldrive/cuid2';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const ROLES = [
	{ name: 'student',     description: 'A learner who can purchase and view assets' },
	{ name: 'instructor',  description: 'Can create assets, manage students, and earn revenue' },
	{ name: 'super_admin', description: 'Full platform access' }
];

async function seed() {
	console.log('🌱 Seeding database...\n');

	// ── 1. Roles ─────────────────────────────────────────────────────────────
	console.log('  → Upserting roles...');
	const roleIds: Record<string, string> = {};

	for (const role of ROLES) {
		const existing = await db
			.select()
			.from(schema.authzRoles)
			.where(eq(schema.authzRoles.name, role.name))
			.limit(1);

		if (existing.length > 0) {
			roleIds[role.name] = existing[0].id;
			console.log(`     ✓ Role '${role.name}' already exists`);
		} else {
			const id = createId();
			await db.insert(schema.authzRoles).values({ id, ...role });
			roleIds[role.name] = id;
			console.log(`     + Created role '${role.name}'`);
		}
	}

	// ── 2. Capabilities ───────────────────────────────────────────────────────
	console.log('\n  → Upserting capabilities...');
	const capabilityIds: Record<string, string> = {};

	for (const key of ALL_CAPABILITIES) {
		const domain = key.split('.')[0];

		const existing = await db
			.select()
			.from(schema.authzCapabilities)
			.where(eq(schema.authzCapabilities.key, key))
			.limit(1);

		if (existing.length > 0) {
			capabilityIds[key] = existing[0].id;
		} else {
			const id = createId();
			await db.insert(schema.authzCapabilities).values({
				id,
				key,
				domain,
				description: `Capability: ${key}`
			});
			capabilityIds[key] = id;
			console.log(`     + Created capability '${key}'`);
		}
	}

	// ── 3. Role ↔ Capability Assignments ─────────────────────────────────────
	console.log('\n  → Assigning capabilities to roles...');

	for (const [roleName, capabilities] of Object.entries(ROLE_CAPABILITY_MAP) as [string, CapabilityKey[]][]) {
		const roleId = roleIds[roleName];
		if (!roleId) continue;

		for (const capKey of capabilities) {
			const capabilityId = capabilityIds[capKey];
			if (!capabilityId) continue;

			await db
				.insert(schema.authzRoleCapabilities)
				.values({ roleId, capabilityId })
				.onConflictDoNothing();
		}
		console.log(`     ✓ ${roleName}: ${capabilities.length} capabilities assigned`);
	}

	console.log('\n✅ Seed complete.');
}

seed()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error('❌ Seed failed:', e);
		process.exit(1);
	});

/**
 * Authorization Engine
 *
 * The single, authoritative point of capability checking in the system.
 *
 * Rules:
 * 1. No code outside this file should inspect user roles directly.
 * 2. All checks flow through `Authorization.can()` or `Authorization.canOrThrow()`.
 * 3. Deny overrides (from authz_user_overrides) always win over role-derived allows.
 * 4. Results are cached in-memory with a short TTL to avoid N+1 queries on
 *    every request. Cache is per-request in Cloudflare Workers (no shared memory).
 *
 * Usage:
 *   const engine = new AuthorizationEngine(db);
 *   await engine.canOrThrow(userId, Capability.ASSET_PUBLISH);
 *
 *   // or
 *   if (await engine.can(userId, Capability.STUDENT_VIEW)) { ... }
 */
import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../db/client';
import {
	authzUserRoles,
	authzRoleCapabilities,
	authzCapabilities,
	authzUserOverrides
} from '../db/schema/authorization.schema';
import { type CapabilityKey, Capability } from './capabilities';
import { ForbiddenError } from '$shared/errors/domain-error';

/** Resolved capability set for a user (capabilities + deny overrides applied) */
interface ResolvedPermissions {
	allowed: Set<CapabilityKey>;
	denied: Set<CapabilityKey>;
}

export class AuthorizationEngine {
	// Request-scoped cache: Map<userId, ResolvedPermissions>
	private cache = new Map<string, ResolvedPermissions>();

	constructor(private readonly db: Database) {}

	/**
	 * Returns true if the user has the given capability.
	 * Returns false if not, or if the user doesn't exist.
	 */
	async can(userId: string, capability: CapabilityKey): Promise<boolean> {
		const permissions = await this.resolve(userId);
		if (permissions.denied.has(capability)) return false;
		return permissions.allowed.has(capability);
	}

	/**
	 * Asserts the user has the capability, or throws ForbiddenError.
	 * Use this in route load functions and API endpoints.
	 */
	async canOrThrow(userId: string, capability: CapabilityKey): Promise<void> {
		const allowed = await this.can(userId, capability);
		if (!allowed) throw new ForbiddenError(capability);
	}

	/**
	 * Returns all capabilities the user has (minus denies).
	 * Useful for building dynamic UIs that show/hide features.
	 */
	async getUserCapabilities(userId: string): Promise<Set<CapabilityKey>> {
		const permissions = await this.resolve(userId);
		const result = new Set<CapabilityKey>(permissions.allowed);
		permissions.denied.forEach((d) => result.delete(d));
		return result;
	}

	/** Check multiple capabilities at once */
	async canAll(userId: string, capabilities: CapabilityKey[]): Promise<boolean> {
		for (const cap of capabilities) {
			if (!(await this.can(userId, cap))) return false;
		}
		return true;
	}

	/** Check if user has at least one of the given capabilities */
	async canAny(userId: string, capabilities: CapabilityKey[]): Promise<boolean> {
		for (const cap of capabilities) {
			if (await this.can(userId, cap)) return true;
		}
		return false;
	}

	// ─── Private Resolution Logic ─────────────────────────────────────────────

	private async resolve(userId: string): Promise<ResolvedPermissions> {
		// Cache hit (within the same request)
		if (this.cache.has(userId)) {
			return this.cache.get(userId)!;
		}

		// Step 1: Get the user's roles
		const userRoles = await this.db
			.select({ roleId: authzUserRoles.roleId })
			.from(authzUserRoles)
			.where(eq(authzUserRoles.userId, userId as any));

		const roleIds = userRoles.map((r) => r.roleId);

		// Step 2: Get capabilities for those roles
		const allowed = new Set<CapabilityKey>();

		if (roleIds.length > 0) {
			const roleCaps = await this.db
				.select({ key: authzCapabilities.key })
				.from(authzRoleCapabilities)
				.innerJoin(
					authzCapabilities,
					eq(authzRoleCapabilities.capabilityId, authzCapabilities.id)
				)
				.where(inArray(authzRoleCapabilities.roleId, roleIds));

			roleCaps.forEach((c) => allowed.add(c.key as CapabilityKey));
		}

		// Step 3: Get direct overrides for this user
		const denied = new Set<CapabilityKey>();
		const overrides = await this.db
			.select({
				key:    authzCapabilities.key,
				effect: authzUserOverrides.effect
			})
			.from(authzUserOverrides)
			.innerJoin(
				authzCapabilities,
				eq(authzUserOverrides.capabilityId, authzCapabilities.id)
			)
			.where(eq(authzUserOverrides.userId, userId as any));

		overrides.forEach((o) => {
			if (o.effect === 'deny')  denied.add(o.key as CapabilityKey);
			if (o.effect === 'allow') allowed.add(o.key as CapabilityKey);
		});

		const permissions: ResolvedPermissions = { allowed, denied };
		this.cache.set(userId, permissions);

		return permissions;
	}
}

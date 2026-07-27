/**
 * Schema Registry
 *
 * This file is the single source of truth for drizzle-kit.
 * All tables must be re-exported here for migrations and the Drizzle client
 * to resolve relations correctly.
 *
 * Ordering: export leaf schemas (no FK dependencies) first.
 */

// Identity (foundation — no foreign deps)
export * from './identity.schema';

// Authorization (depends on identity)
export * from './authorization.schema';

// Storage (no FK deps — cross-domain foundation for file tracking)
export * from './storage.schema';

// Assets (depends on identity)
export * from './assets.schema';

// Cohorts (depends on identity, assets)
export * from './cohorts.schema';

// Commerce (depends on identity, assets)
export * from './commerce.schema';

// Assessments (depends on identity, assets)
export * from './assessments.schema';

// Certificates (depends on identity, assessments)
export * from './certificates.schema';

// Mentoring (depends on identity, assets, commerce)
export * from './mentoring.schema';

// Notifications (depends on identity)
export * from './notifications.schema';

// Analytics (no strong FK deps — user_id is nullable)
export * from './analytics.schema';

// Infrastructure
export * from './outbox.schema';
export * from './platform.schema';

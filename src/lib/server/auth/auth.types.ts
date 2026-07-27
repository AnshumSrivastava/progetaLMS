/**
 * Auth Domain Types
 */
import type { User, Session } from '../db/schema/identity.schema';

/** Resolved user from session (passed via locals) */
export type AuthUser = Pick<User, 'id' | 'email' | 'name' | 'emailVerified' | 'image'>;

/** Session record */
export type AuthSession = Pick<Session, 'id' | 'expiresAt' | 'userId'>;

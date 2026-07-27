/**
 * Domain Error Hierarchy
 *
 * All business logic errors extend DomainError.
 * This allows route handlers to catch typed errors and respond appropriately
 * without polluting business logic with HTTP concerns.
 *
 * Pattern:
 *   Service returns Result<T, DomainError>
 *   Route handler maps DomainError to HTTP response
 */

export abstract class DomainError extends Error {
	abstract readonly code: string;

	constructor(message: string, public readonly context?: Record<string, unknown>) {
		super(message);
		this.name = this.constructor.name;
		// Maintains proper stack trace in V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			context: this.context
		};
	}
}

/** Resource does not exist */
export class NotFoundError extends DomainError {
	readonly code = 'NOT_FOUND';

	constructor(resource: string, identifier?: string) {
		super(
			identifier
				? `${resource} with identifier '${identifier}' was not found.`
				: `${resource} was not found.`,
			{ resource, identifier }
		);
	}
}

/** Caller lacks permission for this operation */
export class ForbiddenError extends DomainError {
	readonly code = 'FORBIDDEN';

	constructor(capability?: string) {
		super(
			capability
				? `You do not have the required capability: '${capability}'.`
				: 'You do not have permission to perform this action.',
			{ capability }
		);
	}
}

/** Input data failed validation */
export class ValidationError extends DomainError {
	readonly code = 'VALIDATION_ERROR';

	constructor(
		message: string,
		public readonly fields?: Record<string, string[]>
	) {
		super(message, { fields });
	}
}

/** Operation conflicts with current state */
export class ConflictError extends DomainError {
	readonly code = 'CONFLICT';

	constructor(message: string, context?: Record<string, unknown>) {
		super(message, context);
	}
}

/** Business rule was violated */
export class BusinessRuleError extends DomainError {
	readonly code = 'BUSINESS_RULE';

	constructor(rule: string, message: string) {
		super(message, { rule });
	}
}

/** External service or dependency failed */
export class ExternalServiceError extends DomainError {
	readonly code = 'EXTERNAL_SERVICE_ERROR';

	constructor(service: string, message: string) {
		super(`External service '${service}' failed: ${message}`, { service });
	}
}

/** Helper: type-guard for DomainError */
export function isDomainError(e: unknown): e is DomainError {
	return e instanceof DomainError;
}

/** Map a DomainError to an HTTP status code */
export function domainErrorToStatus(e: DomainError): number {
	switch (e.code) {
		case 'NOT_FOUND':            return 404;
		case 'FORBIDDEN':            return 403;
		case 'VALIDATION_ERROR':     return 422;
		case 'CONFLICT':             return 409;
		case 'BUSINESS_RULE':        return 400;
		case 'EXTERNAL_SERVICE_ERROR': return 502;
		default:                     return 500;
	}
}

/**
 * Result<T, E> — A discriminated union representing either a successful value (Ok)
 * or a typed failure (Err). Use this instead of throw-based control flow for
 * business logic outcomes. Exceptions are reserved for truly unexpected errors.
 *
 * Usage:
 *   const result = await assetService.findBySlug(slug);
 *   if (result.ok) {
 *     return result.value;
 *   } else {
 *     // result.error is typed as DomainError
 *   }
 */

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

/** Wrap a successful value */
export function ok<T>(value: T): Ok<T> {
	return { ok: true, value };
}

/** Wrap a failure */
export function err<E>(error: E): Err<E> {
	return { ok: false, error };
}

/** Type guard: is this result successful? */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
	return result.ok === true;
}

/** Type guard: is this result a failure? */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
	return result.ok === false;
}

/**
 * Unwrap the value or throw. Only use at boundary layers (route handlers)
 * after you've handled the error branch in domain code.
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
	if (result.ok) return result.value;
	throw result.error;
}

/**
 * Map over a successful result's value.
 */
export function mapOk<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => U
): Result<U, E> {
	if (result.ok) return ok(fn(result.value));
	return result;
}

/**
 * Collapse a Result<Result<T, E>, E> — useful when chaining async operations.
 */
export function flatMap<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => Result<U, E>
): Result<U, E> {
	if (result.ok) return fn(result.value);
	return result;
}

/**
 * Convert a promise that may throw into a Result.
 * Used at external boundaries (DB calls, HTTP clients).
 */
export async function tryAsync<T>(
	fn: () => Promise<T>
): Promise<Result<T, Error>> {
	try {
		return ok(await fn());
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

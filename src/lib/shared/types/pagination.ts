/**
 * Pagination types used across all list queries.
 * Supports both offset-based (simple) and cursor-based (scalable) pagination.
 */

export interface OffsetPagination {
	page: number;     // 1-indexed
	limit: number;
}

export interface CursorPagination {
	cursor?: string;  // opaque cursor — typically an encoded ID + timestamp
	limit: number;
	direction?: 'forward' | 'backward';
}

export interface PaginatedResult<T> {
	items: T[];
	total: number;        // total count (for offset pagination)
	page: number;
	limit: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface CursorPaginatedResult<T> {
	items: T[];
	nextCursor: string | null;
	prevCursor: string | null;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

/** Build a safe, bounded pagination from unknown query params */
export function parsePagination(
	params: { page?: unknown; limit?: unknown },
	defaults: { limit: number; maxLimit: number } = { limit: 20, maxLimit: 100 }
): OffsetPagination {
	const page = Math.max(1, Number(params.page) || 1);
	const limit = Math.min(
		defaults.maxLimit,
		Math.max(1, Number(params.limit) || defaults.limit)
	);
	return { page, limit };
}

export function paginationOffset(p: OffsetPagination): number {
	return (p.page - 1) * p.limit;
}

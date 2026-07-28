import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

export const toasts = writable<Toast[]>([]);

export function addToast(message: string, type: ToastType = 'info', durationMs = 4000) {
	const id = crypto.randomUUID();
	toasts.update((all) => [...all, { id, message, type }]);

	setTimeout(() => {
		removeToast(id);
	}, durationMs);
}

export function removeToast(id: string) {
	toasts.update((all) => all.filter((t) => t.id !== id));
}

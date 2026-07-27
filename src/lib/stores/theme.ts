// Theme store — default light mode, persisted to localStorage
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const stored = browser ? (localStorage.getItem('lms-theme') as Theme | null) : null;
	const initial: Theme = stored ?? 'light';

	const { subscribe, set, update } = writable<Theme>(initial);

	if (browser) {
		// Apply initial theme to <html>
		document.documentElement.setAttribute('data-theme', initial);
	}

	return {
		subscribe,
		toggle() {
			update(current => {
				const next: Theme = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('lms-theme', next);
					document.documentElement.setAttribute('data-theme', next);
				}
				return next;
			});
		},
		set(value: Theme) {
			if (browser) {
				localStorage.setItem('lms-theme', value);
				document.documentElement.setAttribute('data-theme', value);
			}
			set(value);
		}
	};
}

export const theme = createThemeStore();

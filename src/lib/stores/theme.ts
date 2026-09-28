import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
	const initial: Theme = browser
		? ((localStorage.getItem('launchpad-theme') as Theme) || 'system')
		: 'system';

	const { subscribe, set } = writable<Theme>(initial);

	function apply(theme: Theme) {
		if (!browser) return;
		let effectiveTheme = theme;
		if (theme === 'system') {
			effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		document.documentElement.setAttribute('data-theme', effectiveTheme);
		if (effectiveTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	return {
		subscribe,
		setTheme: (newTheme: Theme) => {
			if (browser) {
				localStorage.setItem('launchpad-theme', newTheme);
			}
			set(newTheme);
			apply(newTheme);
		},
		init: () => {
			if (browser) {
				const saved = (localStorage.getItem('launchpad-theme') as Theme) || 'system';
				set(saved);
				apply(saved);

				// Listen for OS scheme change if user is on system
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
					const current = (localStorage.getItem('launchpad-theme') as Theme) || 'system';
					if (current === 'system') {
						apply('system');
					}
				});
			}
		}
	};
}

export const themeStore = createThemeStore();
export const theme = themeStore;

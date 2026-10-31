import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'dark';

function createThemeStore() {
	const { subscribe, set } = writable<Theme>('dark');

	function applyDark() {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', 'dark');
		document.documentElement.classList.add('dark');
		localStorage.setItem('launchpad-theme', 'dark');
	}

	return {
		subscribe,
		setTheme: (_newTheme?: any) => {
			applyDark();
			set('dark');
		},
		init: () => {
			applyDark();
			set('dark');
		},
		toggle: () => {
			applyDark();
			set('dark');
		}
	};
}

export const themeStore = createThemeStore();
export const theme = themeStore;

import { readable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light';

function createThemeStore() {
	const { subscribe } = readable<Theme>('light');

	function enforceLight() {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', 'light');
		document.documentElement.classList.remove('dark');
		try {
			localStorage.removeItem('launchpad-theme');
		} catch (_) {}
	}

	return {
		subscribe,
		setTheme: (_: string) => enforceLight(),
		init: () => enforceLight(),
		toggle: () => enforceLight()
	};
}

export const themeStore = createThemeStore();
export const theme = themeStore;

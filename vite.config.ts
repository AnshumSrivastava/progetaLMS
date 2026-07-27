import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],

	// Prevent Neon serverless from being bundled into client-side code
	optimizeDeps: {
		exclude: ['@neondatabase/serverless']
	},
	server: {
		allowedHosts: ['.loca.lt', '.ngrok-free.app', '.ngrok.io']
	}
});

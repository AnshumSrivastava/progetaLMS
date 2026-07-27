<script lang="ts">
	import type { PageData } from './$types';
	import { authClient } from '$lib/auth.client';
	import { invalidateAll } from '$app/navigation';

	export let data: PageData;
	
	let currentPassword = '';
	let newPassword = '';
	let errorMsg = '';
	let successMsg = false;
	let loading = false;

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMsg = '';
		loading = true;
		
		try {
			const res = await authClient.changePassword({
				newPassword,
				currentPassword,
				revokeOtherSessions: true
			});
			if (res.error) {
				errorMsg = res.error.message || 'Failed to change password';
			} else {
				successMsg = true;
				// Invalidate all to reset load functions
				await invalidateAll();
				// Also hit an API route to remove the forced redirect cookie if needed
				await fetch('/api/auth/reset-admin-cookie', { method: 'POST' });
			}
		} catch (err: any) {
			errorMsg = err.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

	<div class="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
	<h1 class="text-2xl font-bold mb-2">Change Password</h1>
	<p class="text-gray-600 mb-6">Please update your password to secure your account.</p>

	{#if errorMsg}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
			{errorMsg}
		</div>
	{/if}

	{#if successMsg}
		<div class="bg-green-50 text-green-600 p-4 rounded-md mb-4">
			<p class="font-medium">Password changed successfully!</p>
			<a href="/dashboard" class="text-green-700 underline text-sm mt-2 block">Go to Dashboard</a>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
				<input
					type="password"
					id="currentPassword"
					bind:value={currentPassword}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<div>
				<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
				<input
					type="password"
					id="newPassword"
					bind:value={newPassword}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
			>
				{loading ? 'Updating...' : 'Update Password'}
			</button>
		</form>
	{/if}
</div>

<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form } = $props<{ data: PageData, form: ActionData }>();
	
	let loading = $state(false);
</script>

	<div class="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
	<h1 class="text-2xl font-bold mb-2">Change Password</h1>
	<p class="text-gray-600 mb-6">Please update your password to secure your account.</p>

	{#if form?.error}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/changePassword" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }} class="space-y-4">
		<div>
			<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
			<input
				type="password"
				id="currentPassword"
				name="currentPassword"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			/>
		</div>

		<div>
			<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
			<input
				type="password"
				id="newPassword"
				name="newPassword"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			/>
		</div>

		<div>
			<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
			<input
				type="password"
				id="confirmPassword"
				name="confirmPassword"
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
</div>

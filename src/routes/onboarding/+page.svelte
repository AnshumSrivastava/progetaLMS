<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
	let isSubmitting = false;
</script>

<svelte:head>
	<title>Welcome - Complete Your Profile</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			Welcome to the Platform!
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Please tell us your name to complete your profile.
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{#if form?.error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
					<span class="block sm:inline">{form.error}</span>
				</div>
			{/if}

			<form class="space-y-6" method="POST" action="?/saveName" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					update();
				};
			}}>
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700">
						Full Name
					</label>
					<div class="mt-1">
						<input id="name" name="name" type="text" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. Jane Doe">
					</div>
				</div>

				<div>
					<button type="submit" disabled={isSubmitting} class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
						{isSubmitting ? 'Saving...' : 'Continue to Dashboard'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

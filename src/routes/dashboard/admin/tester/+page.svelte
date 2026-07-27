<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { page } from '$app/stores';

	export let form: ActionData;
	
	// Get app URL for links in email
	const appUrl = $page.url.origin;
</script>

<div class="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
	<h1 class="text-2xl font-bold mb-6 text-gray-800">Email Testing Panel</h1>
	<p class="text-gray-600 mb-8">This panel is restricted to Administrators. Use these actions to trigger specific emails to <strong>anshumsrivastava1@gmail.com</strong>.</p>

	{#if form?.error}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
			{form.error}
		</div>
	{/if}
	
	{#if form?.success}
		<div class="bg-green-50 text-green-700 p-3 rounded-md mb-6 text-sm">
			{form.message}
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		
		<!-- Certificate Trigger -->
		<div class="border border-gray-200 p-5 rounded-lg text-center hover:shadow-md transition">
			<h3 class="font-semibold text-lg mb-2">1. Certificate</h3>
			<p class="text-sm text-gray-500 mb-4 h-16">Generates a certificate record and sends an email with the link to view/print it.</p>
			<form method="POST" action="?/sendTestCertificate" use:enhance>
				<input type="hidden" name="appUrl" value={appUrl} />
				<button type="submit" class="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
					Send Certificate
				</button>
			</form>
		</div>

		<!-- Resource Mail Trigger -->
		<div class="border border-gray-200 p-5 rounded-lg text-center hover:shadow-md transition">
			<h3 class="font-semibold text-lg mb-2">2. Resource Mail</h3>
			<p class="text-sm text-gray-500 mb-4 h-16">Sends a general email containing resources and course materials.</p>
			<form method="POST" action="?/sendTestResourceMail" use:enhance>
				<input type="hidden" name="appUrl" value={appUrl} />
				<button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700">
					Send Resource Mail
				</button>
			</form>
		</div>

		<!-- Joining Link Trigger -->
		<div class="border border-gray-200 p-5 rounded-lg text-center hover:shadow-md transition">
			<h3 class="font-semibold text-lg mb-2">3. Joining Link</h3>
			<p class="text-sm text-gray-500 mb-4 h-16">Sends an invitation email with a link to join a Cohort/Class.</p>
			<form method="POST" action="?/sendTestJoiningLink" use:enhance>
				<input type="hidden" name="appUrl" value={appUrl} />
				<button type="submit" class="w-full bg-emerald-600 text-white py-2 rounded font-medium hover:bg-emerald-700">
					Send Joining Link
				</button>
			</form>
		</div>

	</div>
</div>

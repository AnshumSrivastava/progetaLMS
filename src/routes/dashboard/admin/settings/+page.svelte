<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
	<h1 class="text-2xl font-bold mb-2 text-gray-800">Global Settings</h1>
	<p class="text-gray-600 mb-6 text-sm">Toggle major platform features on or off. Note: Admins can always bypass these locks to preview features.</p>
	
	{#if form?.error}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{form.error}</div>
	{/if}
	
	{#if form?.success}
		<div class="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-sm">Settings updated successfully!</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="space-y-6">
		
		<div class="border-b border-gray-200 pb-6">
			<label class="flex items-start cursor-pointer">
				<div class="flex items-center h-5">
					<input 
						type="checkbox" 
						name="enableCatalog" 
						checked={data.settings.enableCatalog} 
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
				</div>
				<div class="ml-3 text-sm">
					<span class="font-medium text-gray-900 block mb-1">Public Course Catalog</span>
					<span class="text-gray-500">Allow users to browse and purchase courses publicly on the /catalog route.</span>
				</div>
			</label>
		</div>

		<div class="border-b border-gray-200 pb-6">
			<label class="flex items-start cursor-pointer">
				<div class="flex items-center h-5">
					<input 
						type="checkbox" 
						name="enableMentoring" 
						checked={data.settings.enableMentoring} 
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
				</div>
				<div class="ml-3 text-sm">
					<span class="font-medium text-gray-900 block mb-1">1-on-1 Mentoring</span>
					<span class="text-gray-500">Allow students to book live mentoring sessions with teachers.</span>
				</div>
			</label>
		</div>

		<div class="pb-2">
			<label class="flex items-start cursor-pointer">
				<div class="flex items-center h-5">
					<input 
						type="checkbox" 
						name="enableCertifications" 
						checked={data.settings.enableCertifications} 
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
				</div>
				<div class="ml-3 text-sm">
					<span class="font-medium text-gray-900 block mb-1">Certifications Engine</span>
					<span class="text-gray-500">Allow users to take automated exams and earn certificates on the platform.</span>
				</div>
			</label>
		</div>

		<div class="pt-4 flex justify-end">
			<button type="submit" class="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition font-medium">
				Save Changes
			</button>
		</div>
	</form>
</div>

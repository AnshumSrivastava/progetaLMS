<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Cohorts (Classes)</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{form.error}</div>
	{/if}

	<!-- Create Form -->
	<div class="bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
		<h2 class="text-lg font-semibold mb-4">Create New Class</h2>
		<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
				<input type="text" name="name" required class="w-full px-3 py-2 border rounded-md" placeholder="e.g. Fall 2026 CS101">
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
				<select name="instructorId" required class="w-full px-3 py-2 border rounded-md">
					{#each data.instructors as inst}
						<option value={inst.id}>{inst.name} ({inst.email})</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Course Material (Optional)</label>
				<select name="courseId" class="w-full px-3 py-2 border rounded-md">
					<option value="">-- Create new placeholder --</option>
					{#each data.assets as asset}
						<option value={asset.id}>{asset.title}</option>
					{/each}
				</select>
			</div>
			<div>
				<button type="submit" class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
					Create Class
				</button>
			</div>
		</form>
	</div>

	<h2 class="text-lg font-semibold mb-4">Active Classes</h2>
	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="bg-gray-50 border-b border-gray-200">
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Class Name</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Teacher</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Course Linked</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.cohorts as cohort}
					<tr class="hover:bg-gray-50">
						<td class="py-3 px-4 font-medium text-gray-800">{cohort.name}</td>
						<td class="py-3 px-4 text-gray-600">{cohort.instructor?.name || 'Unknown'}</td>
						<td class="py-3 px-4 text-gray-600">{cohort.course?.title || 'None'}</td>
						<td class="py-3 px-4">
							{#if cohort.isActive}
								<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
							{:else}
								<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Inactive</span>
							{/if}
						</td>
						<td class="py-3 px-4 text-right">
							<a href="/dashboard/admin/cohorts/{cohort.id}" class="text-blue-600 hover:underline text-sm font-medium">
								Manage Students
							</a>
						</td>
					</tr>
				{/each}
				{#if data.cohorts.length === 0}
					<tr>
						<td colspan="5" class="py-6 text-center text-gray-500">No classes found. Create one above.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

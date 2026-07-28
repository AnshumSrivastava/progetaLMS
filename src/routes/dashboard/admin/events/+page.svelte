<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;
	
	let isCreating = false;
</script>

<div class="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Global Events</h1>
			<p class="text-gray-600 text-sm">Create and manage platform-wide events.</p>
		</div>
		<button 
			onclick={() => isCreating = !isCreating}
			class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
		>
			{isCreating ? 'Cancel' : 'Create Event'}
		</button>
	</div>

	{#if form?.error}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-sm">Action completed successfully.</div>
	{/if}

	{#if isCreating}
		<div class="bg-gray-50 p-6 rounded-md mb-8 border border-gray-200">
			<h2 class="text-lg font-bold mb-4">New Event</h2>
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
						<input type="text" id="title" name="title" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
					</div>
					<div>
						<label for="date" class="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
						<input type="datetime-local" id="date" name="date" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
					</div>
				</div>
				
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<textarea id="description" name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="link" class="block text-sm font-medium text-gray-700 mb-1">Meeting Link (e.g. Zoom/Meet)</label>
						<input type="url" id="link" name="link" class="w-full px-3 py-2 border border-gray-300 rounded-md">
					</div>
					<div>
						<label for="type" class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
						<select id="type" name="type" class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
							<option value="public">Public (All students)</option>
							<option value="private">Private (Invite only)</option>
						</select>
					</div>
				</div>
				
				<div class="flex justify-end pt-2">
					<button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
						Save Event
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		{#each data.events as event}
			<div class="border border-gray-200 rounded-lg p-5 hover:shadow-md transition bg-white">
				<div class="flex justify-between items-start mb-2">
					<h3 class="font-bold text-lg text-gray-900">{event.title}</h3>
					<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium uppercase tracking-wide">
						{event.type}
					</span>
				</div>
				<p class="text-sm text-gray-500 mb-4">{new Date(event.date).toLocaleString()}</p>
				<p class="text-sm text-gray-700 mb-4 line-clamp-2">{event.description || 'No description provided.'}</p>
				
				<div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
					{#if event.link}
						<a href={event.link} target="_blank" class="text-sm text-blue-600 hover:underline font-medium">Meeting Link &rarr;</a>
					{:else}
						<span class="text-sm text-gray-400 italic">No link</span>
					{/if}
					
					<form method="POST" action="?/delete" use:enhance onsubmit={() => confirm('Are you sure you want to delete this event?')}>
						<input type="hidden" name="eventId" value={event.id} />
						<button type="submit" class="text-sm text-red-600 hover:text-red-800 hover:underline">Delete</button>
					</form>
				</div>
			</div>
		{:else}
			<div class="col-span-full py-12 text-center border border-dashed border-gray-300 rounded-lg">
				<p class="text-gray-500">No events found. Create one above!</p>
			</div>
		{/each}
	</div>
</div>

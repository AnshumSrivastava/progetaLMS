<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
	<h1 class="text-2xl font-bold mb-2 text-gray-800">Audit Logs</h1>
	<p class="text-gray-600 mb-6 text-sm">Review platform activities, role changes, and ownership transfers.</p>
	
	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="bg-gray-50 border-b border-gray-200">
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Timestamp</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Actor</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Entity</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Details</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.logs as log}
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
							{new Date(log.createdAt).toLocaleString()}
						</td>
						<td class="py-3 px-4">
							<div class="font-medium text-gray-800 text-sm">{log.actorName || 'Unknown'}</div>
							<div class="text-xs text-gray-500">{log.actorEmail}</div>
						</td>
						<td class="py-3 px-4">
							<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
								{log.action}
							</span>
						</td>
						<td class="py-3 px-4 text-sm text-gray-600">
							{#if log.entityType}
								<span class="font-medium">{log.entityType}:</span> {log.entityId}
							{:else}
								-
							{/if}
						</td>
						<td class="py-3 px-4 text-xs text-gray-500 max-w-xs truncate" title={log.details || ''}>
							{log.details || '-'}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="py-8 text-center text-gray-500">
							No audit logs found.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

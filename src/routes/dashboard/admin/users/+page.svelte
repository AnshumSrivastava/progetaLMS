<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
	<h1 class="text-2xl font-bold mb-6 text-gray-800">User Role Management</h1>
	
	{#if form?.error}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
			{form.error}
		</div>
	{/if}
	
	{#if form?.success}
		<div class="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-sm">
			Role updated successfully.
		</div>
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="bg-gray-50 border-b border-gray-200">
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600">Current Role</th>
					<th class="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Action</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.allUsers as user}
					<tr class="hover:bg-gray-50 transition-colors">
						<td class="py-3 px-4 font-medium text-gray-800">
							{user.name || 'Unnamed'}
							{#if user.role === 'owner'}
								<span class="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase">Owner</span>
							{/if}
						</td>
						<td class="py-3 px-4 text-gray-600">{user.email}</td>
						<td class="py-3 px-4">
							{#if user.role !== 'owner'}
								<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium uppercase tracking-wider">
									{user.role}
								</span>
							{/if}
						</td>
						<td class="py-3 px-4 text-right">
							{#if user.role === 'owner'}
								<span class="text-xs text-gray-400 italic">Cannot modify owner</span>
							{:else}
								<div class="flex flex-col items-end gap-2">
									<form method="POST" action="?/updateRole" use:enhance class="flex items-center gap-2">
										<input type="hidden" name="userId" value={user.id} />
										<select name="role" class="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
											<option value="student" selected={user.role === 'student'}>Student</option>
											<option value="instructor" selected={user.role === 'instructor'}>Instructor</option>
											<option value="admin" selected={user.role === 'admin'}>Admin</option>
										</select>
										<button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition">
											Update
										</button>
									</form>
									
									{#if data.currentUserRole === 'owner'}
										<form method="POST" action="?/transferOwnership" use:enhance onsubmit={() => confirm('Are you sure you want to transfer ownership? You will be demoted to Admin.')}>
											<input type="hidden" name="userId" value={user.id} />
											<button type="submit" class="text-xs text-yellow-600 hover:text-yellow-800 underline">
												Transfer Ownership
											</button>
										</form>
									{/if}
								</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

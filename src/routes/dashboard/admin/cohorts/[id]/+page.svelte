<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
	<div class="mb-6 flex justify-between items-center">
		<div>
			<a href="/dashboard/admin/cohorts" class="text-blue-600 hover:underline text-sm mb-2 inline-block">&larr; Back to Classes</a>
			<h1 class="text-2xl font-bold text-gray-800">Manage Class: {data.cohort.name}</h1>
		</div>
		<form method="POST" action="?/sendResources" use:enhance>
			<input type="hidden" name="appUrl" value={data.appUrl} />
			<button class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium text-sm">
				Email Resources to All
			</button>
		</form>
	</div>

	{#if form?.error}
		<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{form.error}</div>
	{/if}
	
	{#if form?.success}
		<div class="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">{form.message || 'Success!'}</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Left: Enrolled Students -->
		<div class="lg:col-span-2">
			<h2 class="text-lg font-semibold mb-4">Enrolled Students ({data.members.length})</h2>
			<div class="bg-white border border-gray-200 rounded-md overflow-hidden">
				<table class="w-full text-left">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="py-2 px-4 text-sm font-semibold text-gray-600">Student</th>
							<th class="py-2 px-4 text-sm font-semibold text-gray-600">Enrolled</th>
							<th class="py-2 px-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.members as member}
							<tr class="hover:bg-gray-50">
								<td class="py-3 px-4">
									<div class="font-medium text-gray-800">{member.user.name || 'Unnamed'}</div>
									<div class="text-xs text-gray-500">{member.user.email}</div>
								</td>
								<td class="py-3 px-4 text-sm text-gray-600">
									{new Date(member.joinedAt).toLocaleDateString()}
								</td>
								<td class="py-3 px-4 text-right flex justify-end gap-3">
									<form method="POST" action="?/sendExam" use:enhance>
										<input type="hidden" name="userId" value={member.user.id} />
										<input type="hidden" name="appUrl" value={data.appUrl} />
										<button class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Send Exam Link</button>
									</form>
									<form method="POST" action="?/remove" use:enhance>
										<input type="hidden" name="membershipId" value={member.membershipId} />
										<button class="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
									</form>
								</td>
							</tr>
						{/each}
						{#if data.members.length === 0}
							<tr><td colspan="3" class="py-6 text-center text-gray-500">No students enrolled yet.</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Right: Enroll New Student -->
		<div>
			<h2 class="text-lg font-semibold mb-4">Add Student</h2>
			<div class="bg-gray-50 p-4 rounded-md border border-gray-200">
				{#if data.availableStudents.length > 0}
					<form method="POST" action="?/enroll" use:enhance class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
							<select name="userId" required class="w-full px-3 py-2 border rounded-md bg-white">
								<option value="">-- Choose student --</option>
								{#each data.availableStudents as student}
									<option value={student.id}>{student.name || student.email}</option>
								{/each}
							</select>
						</div>
						<button type="submit" class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
							Enroll Student
						</button>
					</form>
				{:else}
					<p class="text-sm text-gray-500 text-center py-4">All available students are already enrolled in this class.</p>
				{/if}
			</div>
		</div>
	</div>
</div>

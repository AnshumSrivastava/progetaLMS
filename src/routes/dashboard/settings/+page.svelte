<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { Shield, KeyRound, Mail, Settings, UserCircle, Users as UsersIcon, Check, X, ShieldAlert, LayoutDashboard } from 'lucide-svelte';

	export let data: PageData;
	export let form: ActionData;

	let currentPreference = data.profile?.loginPreference || 'otp';
	let role = (data.user as any).role;
	
	// Start on admin_pref if we are owner/admin just for convenience
	let activeTab = (role === 'admin' || role === 'owner') ? 'admin_pref' : 'security';
</script>

<svelte:head>
	<title>Account Settings — Progeta LMS</title>
</svelte:head>

<div class="max-w-6xl mx-auto mt-8 p-6">
	<div class="flex flex-col md:flex-row gap-8">
		
		<!-- Sidebar for Settings -->
		<aside class="w-full md:w-64 shrink-0">
			<h2 class="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
				<Settings size={22} /> Settings
			</h2>
			
			<nav class="flex flex-col gap-2">
				<button 
					class="text-left px-4 py-2 rounded-md font-medium text-sm flex items-center gap-3 transition-colors {activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
					onclick={() => activeTab = 'security'}
				>
					<Shield size={18} /> Security & Sign in
				</button>
				
				{#if role === 'admin' || role === 'owner'}
					<button 
						class="text-left px-4 py-2 rounded-md font-medium text-sm flex items-center gap-3 transition-colors {activeTab === 'admin_pref' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
						onclick={() => activeTab = 'admin_pref'}
					>
						<UserCircle size={18} /> Admin Preferences
					</button>
				{/if}
			</nav>
		</aside>

		<!-- Main Content -->
		<main class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-8">
			
			{#if form?.success}
				<div class="bg-green-50 text-green-700 p-4 rounded-md mb-6 border border-green-200">
					{form.message}
				</div>
			{:else if form?.error}
				<div class="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
					{form.error}
				</div>
			{/if}

			{#if activeTab === 'security'}
				<div>
					<h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-4">Sign in Preferences</h3>
					<p class="text-sm text-gray-500 mb-6">Manage how you sign in to your account.</p>

					<!-- Login Preference -->
					<div class="mb-10 bg-gray-50 p-5 rounded-lg border border-gray-200">
						<h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
							<Mail size={16} /> Default Login Method
						</h4>
						<p class="text-sm text-gray-600 mb-4">
							Choose whether you want to receive a 6-digit magic code or use a password when you log in.
						</p>
						
						<form method="POST" action="?/updatePreference" use:enhance class="flex flex-col gap-4">
							<div class="flex items-center gap-6">
								<label class="flex items-center gap-2 cursor-pointer">
									<input type="radio" name="preference" value="otp" checked={currentPreference === 'otp'} class="w-4 h-4 text-blue-600" />
									<span class="text-sm font-medium text-gray-700">Email OTP (Magic Code)</span>
								</label>
								<label class="flex items-center gap-2 cursor-pointer">
									<input type="radio" name="preference" value="password" checked={currentPreference === 'password'} class="w-4 h-4 text-blue-600" />
									<span class="text-sm font-medium text-gray-700">Password</span>
								</label>
							</div>
							<button type="submit" class="self-start px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-md transition-colors">
								Save Preference
							</button>
						</form>
					</div>

					<!-- Password Management -->
					<div class="bg-gray-50 p-5 rounded-lg border border-gray-200">
						<h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
							<KeyRound size={16} /> Set or Change Password
						</h4>
						<p class="text-sm text-gray-600 mb-4">
							Set a new password for your account. You can use this to sign in if you prefer not to use email codes.
						</p>
						
						<form method="POST" action="?/updatePassword" use:enhance class="max-w-sm flex flex-col gap-4">
							<div>
								<label for="newPassword" class="block text-xs font-medium text-gray-700 mb-1">New Password</label>
								<input type="password" id="newPassword" name="newPassword" required minlength="8" 
									class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
							</div>
							<div>
								<label for="confirmPassword" class="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
								<input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" 
									class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
							</div>
							<button type="submit" class="self-start px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
								Update Password
							</button>
						</form>
					</div>
				</div>
			{/if}

			{#if activeTab === 'admin_pref'}
				<div>
					<h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-4">Admin Preferences</h3>
					<p class="text-sm text-gray-500 mb-6">Manage global administrative settings and platform users.</p>
					
					<!-- Global Platform Settings -->
					<div class="mb-10 bg-gray-50 p-5 rounded-lg border border-gray-200">
						<h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
							<LayoutDashboard size={18} /> Platform Features
						</h4>
						
						<form method="POST" action="?/updatePlatformSettings" use:enhance class="space-y-4">
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" name="enableCatalog" value="true" checked={data.platformSettings?.enableCatalog} class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
								<div>
									<span class="block text-sm font-medium text-gray-900">Enable Course Catalog</span>
									<span class="block text-xs text-gray-500">Allow users to browse and purchase courses.</span>
								</div>
							</label>

							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" name="enableMentoring" value="true" checked={data.platformSettings?.enableMentoring} class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
								<div>
									<span class="block text-sm font-medium text-gray-900">Enable Mentoring</span>
									<span class="block text-xs text-gray-500">Allow users to book 1-on-1 sessions.</span>
								</div>
							</label>

							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" name="enableCertifications" value="true" checked={data.platformSettings?.enableCertifications} class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
								<div>
									<span class="block text-sm font-medium text-gray-900">Enable Certifications</span>
									<span class="block text-xs text-gray-500">Allow users to take exams and earn certificates.</span>
								</div>
							</label>
							
							<div class="pt-2">
								<button type="submit" class="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-md transition-colors">
									Save Feature Toggles
								</button>
							</div>
						</form>
					</div>

					<!-- User Management -->
					<div class="bg-gray-50 p-5 rounded-lg border border-gray-200 overflow-x-auto">
						<h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
							<UsersIcon size={18} /> User Management
						</h4>
						
						<table class="w-full text-left text-sm border-collapse">
							<thead>
								<tr class="border-b border-gray-200">
									<th class="pb-3 font-semibold text-gray-600">User</th>
									<th class="pb-3 font-semibold text-gray-600">Role</th>
									<th class="pb-3 font-semibold text-gray-600">Status</th>
									<th class="pb-3 font-semibold text-gray-600 text-right">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#each data.allUsers as u}
									<tr class="hover:bg-gray-100 transition-colors">
										<td class="py-3">
											<div class="font-medium text-gray-900">{u.name}</div>
											<div class="text-xs text-gray-500">{u.email}</div>
										</td>
										<td class="py-3">
											<form method="POST" action="?/updateUserRole" use:enhance class="inline-flex items-center">
												<input type="hidden" name="userId" value={u.id} />
												<select 
													name="role" 
													class="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
													onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
												>
													<option value="student" selected={u.role === 'student'}>Student</option>
													<option value="teacher" selected={u.role === 'teacher'}>Teacher</option>
													{#if role === 'owner'}
														<option value="admin" selected={u.role === 'admin'}>Admin</option>
														<option value="owner" selected={u.role === 'owner'}>Owner</option>
													{/if}
												</select>
											</form>
										</td>
										<td class="py-3">
											{#if u.banned}
												<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
													Banned
												</span>
											{:else}
												<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
													Active
												</span>
											{/if}
										</td>
										<td class="py-3 text-right">
											<form method="POST" action="?/toggleUserBan" use:enhance class="inline-block">
												<input type="hidden" name="userId" value={u.id} />
												<input type="hidden" name="action" value={u.banned ? 'unban' : 'ban'} />
												<button 
													type="submit" 
													class="text-xs font-medium px-3 py-1 rounded border transition-colors {u.banned ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-red-200 text-red-700 hover:bg-red-50'}"
												>
													{u.banned ? 'Unban' : 'Ban'}
												</button>
											</form>
										</td>
									</tr>
								{/each}
								{#if data.allUsers.length === 0}
									<tr>
										<td colspan="4" class="py-8 text-center text-gray-500 text-sm">
											No other users found on the platform.
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>

				</div>
			{/if}
			
		</main>
	</div>
</div>

<script lang="ts">
	import { Settings, Users, Layers, Activity, Eye, Mail } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedTemplate = $state(data.templates[0]);
</script>

<svelte:head>
	<title>Admin Hub — ProgetaLMS</title>
</svelte:head>

<div class="max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-12">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-slate-900">Admin Hub</h1>
		<p class="text-slate-500 mt-1">Platform settings, impersonation, and sub-dashboards.</p>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<!-- Quick Links -->
		<a href="/dashboard/admin/users" class="flex items-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all">
			<div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
				<Users size={24} />
			</div>
			<div>
				<h3 class="font-semibold text-slate-900">Users</h3>
				<p class="text-sm text-slate-500">Manage all accounts</p>
			</div>
		</a>

		<a href="/dashboard/admin/cohorts" class="flex items-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-emerald-500 hover:shadow-md transition-all">
			<div class="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mr-4">
				<Layers size={24} />
			</div>
			<div>
				<h3 class="font-semibold text-slate-900">Cohorts</h3>
				<p class="text-sm text-slate-500">Manage classes & groups</p>
			</div>
		</a>

		<a href="/dashboard/admin/tester" class="flex items-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-purple-500 hover:shadow-md transition-all">
			<div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mr-4">
				<Activity size={24} />
			</div>
			<div>
				<h3 class="font-semibold text-slate-900">Tester Portal</h3>
				<p class="text-sm text-slate-500">System utilities</p>
			</div>
		</a>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Platform Settings -->
		<section class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
			<div class="flex items-center mb-6">
				<Settings class="text-slate-400 mr-2" size={20} />
				<h2 class="text-xl font-bold text-slate-900">Platform Features</h2>
			</div>
			
			<form method="POST" action="?/updateSettings" class="space-y-4">
				<label class="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100">
					<div>
						<span class="font-semibold text-slate-900 block">Course Catalog</span>
						<span class="text-sm text-slate-500">Allow users to browse all public courses.</span>
					</div>
					<input type="checkbox" name="enableCatalog" checked={data.settings.enableCatalog} class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
				</label>

				<label class="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100">
					<div>
						<span class="font-semibold text-slate-900 block">Mentoring Booking</span>
						<span class="text-sm text-slate-500">Allow users to view and book 1-on-1 sessions.</span>
					</div>
					<input type="checkbox" name="enableMentoring" checked={data.settings.enableMentoring} class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
				</label>

				<label class="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100">
					<div>
						<span class="font-semibold text-slate-900 block">Certifications Hub</span>
						<span class="text-sm text-slate-500">Allow users to browse certification exams.</span>
					</div>
					<input type="checkbox" name="enableCertifications" checked={data.settings.enableCertifications} class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
				</label>

				<button type="submit" class="w-full mt-4 bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
					Save Settings
				</button>
			</form>
		</section>

		<!-- Impersonation -->
		<section class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
			<div class="flex items-center mb-6">
				<Eye class="text-slate-400 mr-2" size={20} />
				<h2 class="text-xl font-bold text-slate-900">Impersonation</h2>
			</div>
			
			<p class="text-slate-500 text-sm mb-6">
				View the application precisely as a different role. You will lose access to this admin panel while impersonating, but a floating button will allow you to exit.
			</p>

			<form method="POST" action="?/impersonate" class="space-y-4">
				<div>
					<label for="role" class="block text-sm font-medium text-slate-700 mb-1">Select Role to Impersonate</label>
					<select id="role" name="role" class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
						<option value="student">Student</option>
						<option value="instructor">Instructor</option>
					</select>
				</div>

				<button type="submit" class="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
					Start Impersonating
				</button>
			</form>
		</section>
	</div>

	<!-- Email Templates -->
	<section class="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
		<div class="flex items-center mb-6">
			<Mail class="text-slate-400 mr-2" size={20} />
			<h2 class="text-xl font-bold text-slate-900">Email Templates (Markdown)</h2>
		</div>

		<form method="POST" action="?/saveTemplate" class="space-y-4 max-w-3xl">
			<div class="flex gap-4 mb-4">
				{#each data.templates as tpl}
					<button type="button" class="px-4 py-2 rounded-md text-sm font-medium transition-colors {selectedTemplate.id === tpl.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" onclick={() => selectedTemplate = tpl}>
						{tpl.id}
					</button>
				{/each}
			</div>

			<input type="hidden" name="id" value={selectedTemplate.id} />

			<div>
				<label for="subject" class="block text-sm font-medium text-slate-700 mb-1">Email Subject</label>
				<input type="text" id="subject" name="subject" bind:value={selectedTemplate.subject} class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
			</div>

			<div>
				<label for="body" class="block text-sm font-medium text-slate-700 mb-1">Email Body (Markdown supported)</label>
				<textarea id="body" name="body" bind:value={selectedTemplate.body} rows="8" class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"></textarea>
			</div>

			<button type="submit" class="bg-slate-900 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-slate-800 transition-colors">
				Save Template
			</button>
		</form>
	</section>
</div>

<script lang="ts">
	import type { PageData } from './$types';
	import { APP_NAME } from '$lib/shared/constants';
	import { Download, ArrowLeft, CheckCircle2, Shield } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';

	let { data }: { data: PageData } = $props();

	const metadata = $derived((data.certificate.metadata as any) || {});
	const studentName = $derived(metadata.studentName || 'Recipient Name');
	const testName = $derived(metadata.testName || 'Certification');
	const certId = $derived(data.certificate.id);
	const issuedAt = $derived(data.certificate.issuedAt ? new Date(data.certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
</script>

<svelte:head>
	<title>{studentName} · {testName} Credential — {APP_NAME}</title>
	<style>
		@media print {
			body { margin: 0; padding: 0; background: #ffffff !important; }
			.no-print { display: none !important; }
			@page { size: landscape; margin: 0; }
		}
	</style>
</svelte:head>

<div class="cert-viewer-page min-h-screen bg-[var(--background)] flex flex-col justify-between">
	
	<!-- Top Bar -->
	<header class="no-print bg-[var(--surface)] border-b border-[var(--border)] py-4">
		<div class="container-custom flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<a href="/dashboard" class="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
					<ArrowLeft size={14} />
					<span>Dashboard</span>
				</a>
				<span class="text-[var(--border-strong)]">·</span>
				<div class="flex items-center gap-2">
					<span class="meta-mono text-[10px] text-[var(--text-muted)]">ID: {certId.slice(0, 14)}...</span>
					<VerifiedBadge text="Launchpad Authenticated" />
				</div>
			</div>

			<div class="flex items-center gap-3">
				<Button onclick={() => window.print()} variant="primary" size="sm">
					<Download size={14} /> <span>Print / Download PDF</span>
				</Button>
			</div>
		</div>
	</header>

	<!-- SVG Certificate Canvas -->
	<main class="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
		<div class="w-full max-w-[1100px] bg-white border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden shadow-sm aspect-[1.414/1]">
			{@html data.svg}
		</div>

		<!-- Authenticity Footer Note -->
		<div class="no-print mt-6 text-center space-y-1">
			<div class="flex items-center justify-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
				<Shield size={14} class="text-[var(--lp-accent)]" />
				<span>This credential is cryptographically registered and tamper-evident.</span>
			</div>
			<p class="text-[11px] text-[var(--text-muted)]">
				Issued to <strong class="text-[var(--text-primary)]">{studentName}</strong> on {issuedAt}.
			</p>
		</div>
	</main>

	<!-- Bottom system spacer -->
	<div class="no-print py-4"></div>
</div>

<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import LegalPage from '$lib/components/ui/LegalPage.svelte';
</script>

<svelte:head>
	<title>Terms of Service — {APP_NAME}</title>
</svelte:head>

<LegalPage label="Legal" title="Terms of Service" updated="July 2025">
	<p>By accessing or using the Launchpad platform (operated by Progeta Technologies), you agree to be bound by these Terms of Service. Please read them carefully before using the platform.</p>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">1. Use of the Platform</h3>
		<p>Launchpad grants you a non-exclusive, non-transferable license to access and use the platform for personal, non-commercial learning purposes. You agree not to reproduce, distribute, or resell any assets purchased on the platform.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">2. Digital Asset Ownership</h3>
		<p>Upon purchase, you receive a permanent, individual license to access the purchased digital asset. This license is personal and non-transferable. You may not share, resell, or redistribute any purchased content.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">3. Account Responsibility</h3>
		<p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@progeta.in if you suspect unauthorized access.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">4. Termination</h3>
		<p>We reserve the right to suspend or terminate accounts that violate these terms. Purchased digital assets will remain accessible unless the violation involves fraudulent transactions.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">5. Changes to Terms</h3>
		<p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
	</div>

	<p style="font-size: 0.8125rem; color: var(--text-muted);">For questions, contact us at legal@progeta.in</p>
</LegalPage>

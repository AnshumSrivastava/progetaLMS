<script lang="ts">
	import LegalPage from '$lib/components/ui/LegalPage.svelte';
</script>

<svelte:head>
	<title>Privacy Policy — Launchpad</title>
</svelte:head>

<LegalPage label="Legal" title="Privacy Policy" updated="July 2025">
	<p>Progeta Technologies ("we", "our", "us") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights regarding your personal information.</p>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">1. Data We Collect</h3>
		<p>We collect information you provide directly (name, email address, payment details) and data generated through platform use (purchase history, assessment results, session bookings).</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">2. How We Use Your Data</h3>
		<p>Your data is used to operate and improve the platform, process payments, issue certificates, and send relevant communications. We do not sell your personal data to third parties.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">3. Third-Party Services</h3>
		<p>We use the following third-party services: Cashfree (payment processing), Resend (transactional email), and Neon (database hosting). Each service has its own privacy policy.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">4. Data Retention</h3>
		<p>We retain your account data for as long as your account is active, and for a further 90 days after deletion for legal compliance purposes. Transaction records are retained for 7 years per Indian accounting law.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">5. Your Rights</h3>
		<p>You have the right to access, correct, or delete your personal data. To exercise these rights, email us at privacy@progeta.in. We will respond within 30 days.</p>
	</div>

	<p style="font-size: 0.8125rem; color: var(--text-muted);">For questions, contact us at privacy@progeta.in</p>
</LegalPage>

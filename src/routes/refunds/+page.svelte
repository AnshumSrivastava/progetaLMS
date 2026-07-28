<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import LegalPage from '$lib/components/ui/LegalPage.svelte';
</script>

<svelte:head>
	<title>Refund Policy — {APP_NAME}</title>
</svelte:head>

<LegalPage label="Legal" title="Refund Policy" updated="July 2025">
	<p>We aim to make every purchase on Launchpad worthwhile. This policy describes under what circumstances refunds are granted.</p>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">Digital Assets</h3>
		<p>Due to the nature of digital goods, all digital asset purchases are <strong style="color: var(--text-primary); font-weight: 500;">non-refundable</strong> once access has been granted. If you have not yet accessed the content, you may request a refund within 24 hours of purchase.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">Mentorship Sessions</h3>
		<p>Mentorship sessions may be cancelled and fully refunded up to <strong style="color: var(--text-primary); font-weight: 500;">12 hours before the scheduled time</strong>. Cancellations after this window will not be refunded. No-shows are non-refundable.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">Certification Tests</h3>
		<p>Certification test fees are non-refundable once the test has been started. If a technical issue on our side prevents you from completing the test, a full refund or complimentary retake will be offered.</p>
	</div>

	<div>
		<h3 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 8px;">How to Request a Refund</h3>
		<p>Email refunds@progeta.in with your order ID and reason. We process eligible refunds within 5–7 business days. Refunds are returned to the original payment method.</p>
	</div>

	<p style="font-size: 0.8125rem; color: var(--text-muted);">For questions, contact us at refunds@progeta.in</p>
</LegalPage>

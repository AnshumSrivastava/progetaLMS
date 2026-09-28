<script lang="ts">
	import { ShieldCheck } from 'lucide-svelte';

	let {
		size = 14,
		title = 'Launchpad Verified'
	}: {
		size?: number;
		title?: string;
	} = $props();
</script>

<span
	class="inline-flex items-center justify-center text-[var(--color-text-secondary)] hover:opacity-85 transition-opacity cursor-help"
	{title}
	aria-label={title}
>
	<ShieldCheck {size} strokeWidth={2.2} />
</span>

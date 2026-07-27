<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		children,
		variant = 'primary',
		size = 'md',
		class: className = '',
		...rest
	}: HTMLButtonAttributes & {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();
</script>

<button
	class="inline-flex items-center justify-center gap-2 rounded-md font-medium
	       cursor-pointer select-none transition-all duration-[120ms] ease-[ease]
	       focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2
	       disabled:opacity-40 disabled:pointer-events-none
	       active:scale-[0.97]
	       {size === 'sm'  ? 'h-8  px-3 text-sm'  : ''}
	       {size === 'md'  ? 'h-9  px-4 text-sm'  : ''}
	       {size === 'lg'  ? 'h-11 px-6 text-base': ''}
	       {variant === 'primary'   ? 'bg-[var(--accent)] text-white hover:opacity-90 shadow-sm hover:shadow-md' : ''}
	       {variant === 'secondary' ? 'bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.05)] shadow-sm' : ''}
	       {variant === 'ghost'     ? 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]' : ''}
	       {className}"
	{...rest}
>
	{@render children()}
</button>

<script lang="ts">
	import { toasts, removeToast } from '$lib/stores/toast';
	import { X, CheckCircle, AlertCircle, Info } from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
</script>

<div class="toast-container">
	{#each $toasts as toast (toast.id)}
		<div
			class="toast {toast.type}"
			animate:flip={{ duration: 300 }}
			in:fly={{ y: 20, duration: 300 }}
			out:fly={{ opacity: 0, duration: 200 }}
		>
			<div class="icon">
				{#if toast.type === 'success'}
					<CheckCircle size={20} />
				{:else if toast.type === 'error'}
					<AlertCircle size={20} />
				{:else}
					<Info size={20} />
				{/if}
			</div>
			<div class="message">{toast.message}</div>
			<button class="close-btn" onclick={() => removeToast(toast.id)}>
				<X size={16} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 24px;
		right: 24px;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 12px;
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		min-width: 300px;
		max-width: 400px;
	}

	.toast.success .icon {
		color: #10b981;
	}
	.toast.error .icon {
		color: #ef4444;
	}
	.toast.info .icon {
		color: #3b82f6;
	}

	.message {
		flex-grow: 1;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: var(--bg-subtle);
		color: var(--text-primary);
	}
</style>

<script lang="ts">
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowRight, Terminal } from 'lucide-svelte';

	let { course }: { course: any } = $props();

	const level = $derived((course.metadata?.level || 'Beginner').toUpperCase());
	const duration = $derived(course.metadata?.duration || course.metadata?.hours || '8 hours');
	const instructor = $derived(course.metadata?.instructorName || course.metadata?.author || 'Launchpad Faculty');
	const free = $derived(!course.pricePaise || course.pricePaise === 0);
	const priceFormatted = $derived(free ? 'Free' : `₹${(course.pricePaise / 100).toLocaleString('en-IN')}`);
</script>

<div class="featured-experience-root">
	<div class="featured-grid">
		<!-- Left Editorial Content Column -->
		<div class="featured-content">
			<div class="flex items-center gap-2 mb-3">
				<span class="meta-mono text-[10px]">FEATURED CURRICULUM</span>
				<span class="text-[var(--color-border-strong)]">·</span>
				<VerifiedBadge size="small" text="Launchpad Verified" />
			</div>

			<h2 class="featured-title">
				{course.title}
			</h2>

			<p class="featured-desc">
				{course.description || 'Master practical technical proficiencies, defensive workflows, and verifiable skill competencies through practitioner-guided curriculum.'}
			</p>

			<!-- Quick Spec Matrix -->
			<div class="featured-meta-matrix">
				<div class="matrix-cell">
					<span class="matrix-label">Track Level</span>
					<span class="matrix-val">{level}</span>
				</div>
				<div class="matrix-cell border-x border-[var(--color-border)]">
					<span class="matrix-label">Estimated Pacing</span>
					<span class="matrix-val">{duration}</span>
				</div>
				<div class="matrix-cell">
					<span class="matrix-label">Instruction</span>
					<span class="matrix-val">{instructor}</span>
				</div>
			</div>

			<div class="featured-actions">
				<Button variant="primary" size="lg" href={`/catalog/${course.id}`}>
					<span>Start Learning</span>
					<ArrowRight size={15} />
				</Button>
				<span class="featured-price-tag">
					<strong>{priceFormatted}</strong>
					<span class="text-[var(--color-text-muted)] text-[12px] font-normal"> / full curriculum</span>
				</span>
			</div>
		</div>

		<!-- Right Product Photography: Interactive Terminal & Code Artifact -->
		<div class="featured-artifact-col">
			<div class="terminal-window">
				<div class="terminal-bar">
					<div class="terminal-dots">
						<span class="dot"></span>
						<span class="dot"></span>
						<span class="dot"></span>
					</div>
					<div class="terminal-title">
						<Terminal size={12} />
						<span>lab-env-01 ~ launchpad</span>
					</div>
					<span class="terminal-status">LIVE ENV</span>
				</div>
				<div class="terminal-body font-mono">
					<div class="line prompt"><span class="cmd-user">student@launchpad</span>:<span class="cmd-path">~/defense</span>$ nmap -sS -T4 -p 22,80,443 target.progeta.internal</div>
					<div class="line text-[var(--color-text-muted)]">Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-26 04:00 IST</div>
					<div class="line text-[var(--color-text-secondary)]">Nmap scan report for target.progeta.internal (10.0.4.15)</div>
					<div class="line text-[var(--color-text-secondary)]">Host is up (0.0012s latency).</div>
					<div class="line mt-2 text-[var(--color-text-primary)] font-semibold">PORT     STATE SERVICE</div>
					<div class="line text-[#BDBDBD]">22/tcp   open  ssh (OpenSSH 9.2p1)</div>
					<div class="line text-[#BDBDBD]">80/tcp   open  http (nginx 1.24)</div>
					<div class="line text-[#BDBDBD]">443/tcp  open  ssl/https</div>
					<div class="line mt-2 prompt"><span class="cmd-user">student@launchpad</span>:<span class="cmd-path">~/defense</span>$ sudo systemctl status iptables-firewall</div>
					<div class="line flex items-center gap-1.5 text-[#BDBDBD]">
						<span class="inline-block w-1.5 h-1.5 rounded-full bg-[#BDBDBD]"></span>
						<span>Active: active (running) · 14 inspection rules enforced</span>
					</div>
					<div class="line text-[var(--color-text-muted)] mt-1">Verification token generated: LP-DEF-8834920</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.featured-experience-root {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 40px;
		margin-bottom: 64px;
		position: relative;
		overflow: hidden;
	}

	.featured-grid {
		display: grid;
		grid-template-columns: 1fr 1.05fr;
		gap: 48px;
		align-items: center;
	}

	.featured-title {
		font-size: clamp(1.75rem, 2.5vw, 2.25rem);
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.03em;
		line-height: 1.15;
		margin-bottom: 14px;
	}

	.featured-desc {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin-bottom: 24px;
	}

	.featured-meta-matrix {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		background: var(--color-surface-subtle);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 12px 14px;
		margin-bottom: 28px;
	}

	.matrix-cell {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: center;
	}

	.matrix-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.matrix-val {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.featured-actions {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.featured-price-tag {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text);
	}

	/* Terminal Window Product Artifact */
	.terminal-window {
		background: #0E0E10;
		border: 1px solid #2C2C32;
		border-radius: var(--radius-md);
		overflow: hidden;
		box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2);
	}

	.terminal-bar {
		background: #161619;
		padding: 10px 14px;
		border-bottom: 1px solid #2C2C32;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.terminal-dots {
		display: flex;
		gap: 6px;
	}

	.terminal-dots .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #3A3A42;
	}

	.terminal-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: #A1A1A9;
	}

	.terminal-status {
		font-family: var(--font-mono);
		font-size: 0.5625rem;
		font-weight: 700;
		color: #BDBDBD;
		letter-spacing: 0.08em;
	}

	.terminal-body {
		padding: 18px;
		font-size: 0.75rem;
		line-height: 1.6;
		color: #EDEDEB;
	}

	.line {
		word-break: break-all;
	}

	.prompt {
		color: #A1A1A9;
	}

	.cmd-user {
		color: #71717A;
	}

	.cmd-path {
		color: #A1A1A9;
	}

	@media (max-width: 960px) {
		.featured-grid {
			grid-template-columns: 1fr;
			gap: 32px;
		}
		.featured-experience-root {
			padding: 24px;
		}
	}
</style>

<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import {
		Terminal,
		Flag,
		Shield,
		Clock,
		Flame,
		Trophy,
		ExternalLink,
		CheckCircle2,
		Copy,
		Check,
		Play,
		RotateCcw,
		HelpCircle,
		Lock,
		Sparkles,
		Users,
		Award,
		ArrowRight,
		FileCode,
		X
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State
	let activeTab = $state<'stages' | 'scoreboard' | 'rules'>('stages');
	let activeStageId = $state<string>('stage-3');
	let isEnrolled = $state(data.isEnrolled ?? true);

	// Machine simulator state
	let machineRunning = $state(true);
	let targetIp = $state('10.10.14.204');
	let copiedIp = $state(false);
	let timeRemaining = $state('01:48:32');
	let showTerminal = $state(false);
	let showHint = $state(false);

	// Flag submission state
	let flagInput = $state('');
	let submissionStatus = $state<'idle' | 'success' | 'error'>('idle');
	let submissionFeedback = $state('');

	// Dynamic stages tracking
	let stages = $state(data.hackathon.stages || []);
	let userScore = $state(350); // Stages 1 & 2 solved

	const activeStage = $derived(stages.find((s) => s.id === activeStageId) || stages[2]);

	function copyIp() {
		navigator.clipboard.writeText(targetIp);
		copiedIp = true;
		setTimeout(() => (copiedIp = false), 2000);
	}

	function handleRestartMachine() {
		machineRunning = false;
		setTimeout(() => {
			machineRunning = true;
			timeRemaining = '02:00:00';
		}, 800);
	}

	function handleSubmitFlag(e: Event) {
		e.preventDefault();
		const trimmed = flagInput.trim();
		if (!trimmed) return;

		if (trimmed === activeStage.flag || trimmed === 'flag{hackdef_crypto_e37a}') {
			submissionStatus = 'success';
			submissionFeedback = `Flag verified! +${activeStage.points} PTS awarded to your team.`;
			activeStage.solved = true;
			userScore += activeStage.points;

			// Unlock stage 4 if stage 3 solved
			const s4 = stages.find((s) => s.id === 'stage-4');
			if (s4) s4.locked = false;

			flagInput = '';
		} else {
			submissionStatus = 'error';
			submissionFeedback = 'Incorrect flag token. Verify cryptographic nonce bias and private key recovery.';
		}
	}

	// Terminal simulator state
	let termLines = $state<string[]>([
		'Connected to HackDef Sandbox v2.4 (x86_64-linux-gnu)',
		'Target IP: 10.10.14.204 | Ports: 8080 (http-api), 2222 (ssh-gateway)',
		'Type "help" or run "nmap 10.10.14.204" to enumerate the target.'
	]);
	let termInput = $state('');

	function handleTermCommand(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const cmd = termInput.trim();
			if (!cmd) return;
			termLines = [...termLines, `hacker@alphasec:~$ ${cmd}`];

			if (cmd.toLowerCase() === 'help') {
				termLines = [
					...termLines,
					'Available tools: nmap, curl, python3, openssl, cat, clear'
				];
			} else if (cmd.toLowerCase().startsWith('nmap')) {
				termLines = [
					...termLines,
					'Starting Nmap 7.94 scan at 10.10.14.204...',
					'PORT     STATE SERVICE VERSION',
					'8080/tcp open  http    Python/Gunicorn ECDSA Oracle v1.2',
					'2222/tcp open  ssh     OpenSSH 8.9p1 Ubuntu (sandbox)',
					'Nmap done: 1 IP address scanned in 1.42 seconds'
				];
			} else if (cmd.toLowerCase().startsWith('curl')) {
				termLines = [
					...termLines,
					'HTTP/1.1 200 OK',
					'Content-Type: application/json',
					'X-Oracle-Curve: secp256k1',
					'{"status": "ready", "oracle_leak_bits": 8, "vault_cipher": "e37a_99b0c..."}'
				];
			} else if (cmd.toLowerCase() === 'clear') {
				termLines = [];
			} else if (cmd.toLowerCase().includes('flag')) {
				termLines = [
					...termLines,
					'Challenge flag: flag{hackdef_crypto_e37a}'
				];
			} else {
				termLines = [
					...termLines,
					`bash: ${cmd.split(' ')[0]}: command executed in simulated container environment`
				];
			}
			termInput = '';
		}
	}

	// Scoreboard mock data
	const leaderboard = [
		{ rank: 1, team: 'CyberVanguard', points: 1200, solves: 4, firstBlood: 'Stage 1', lastSolve: '14m ago' },
		{ rank: 2, team: 'NullByte Elite', points: 950, solves: 3, firstBlood: 'Stage 2', lastSolve: '32m ago' },
		{ rank: 3, team: 'RootSquad', points: 700, solves: 3, firstBlood: '—', lastSolve: '45m ago' },
		{ rank: 4, team: 'Team AlphaSec (You)', points: userScore, solves: 2, firstBlood: '—', lastSolve: '1h 12m ago', isUser: true },
		{ rank: 5, team: 'KernelPanic', points: 350, solves: 2, firstBlood: '—', lastSolve: '1h 45m ago' },
		{ rank: 6, team: 'ZeroDay Knights', points: 250, solves: 1, firstBlood: '—', lastSolve: '2h 10m ago' }
	];
</script>

<svelte:head>
	<title>HackDef 2026 CTF Hackathon Arena — {APP_NAME}</title>
	<meta
		name="description"
		content="Official 24-Hour Inter-Collegiate & Practitioner Cybersecurity Hackathon. 5 progressive challenge stages with isolated target sandboxes and live scoring."
	/>
</svelte:head>

<div class="hackathon-arena-root">
	<div class="arena-container">
		<!-- ── ARENA HERO & EVENT HEADER ──────────────────────── -->
		<header class="hackathon-hero">
			<div class="hero-top-eyebrow">
				<span class="live-pulse-badge">
					<span class="pulse-dot"></span>
					<span>LIVE HACKATHON ARENA</span>
				</span>
				<span class="eyebrow-sep">•</span>
				<span class="prize-tag">₹1,00,000 PRIZE POOL</span>
				<span class="eyebrow-sep">•</span>
				<span class="text-xs text-slate-400 font-mono">PAID EVENT · ₹1,499 PER TEAM</span>
			</div>

			<div class="hero-main-row">
				<div class="hero-title-col">
					<h1 class="hero-arena-title">
						HackDef 2026: Collegiate &amp; Practitioner CTF Arena
					</h1>
					<p class="hero-arena-desc">
						The flagship 24-hour multi-stage cybersecurity hackathon. 5 progressive attack vectors across OSINT, Web Exploitation, Cryptography, Cloud Infrastructure, and Kernel Ring-0 Pwn. Spin up isolated target machines, submit flags, and climb the live scoreboard.
					</p>
				</div>

				<!-- Event Quick Stats Card -->
				<div class="hero-stats-card">
					<div class="stat-box">
						<span class="stat-label">Your Score</span>
						<span class="stat-value text-amber-400">{userScore} <span class="text-xs text-slate-400 font-normal">/ 1,950 PTS</span></span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-box">
						<span class="stat-label">Current Rank</span>
						<span class="stat-value text-emerald-400">#4 <span class="text-xs text-slate-400 font-normal">of 42 Teams</span></span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-box">
						<span class="stat-label">Arena Closes In</span>
						<span class="stat-value text-sky-400 font-mono">18h 42m</span>
					</div>
				</div>
			</div>

			<!-- Navigation Tabs Bar -->
			<div class="arena-tabs-bar">
				<div class="tab-buttons">
					<button
						class="arena-tab-btn"
						class:active={activeTab === 'stages'}
						onclick={() => (activeTab = 'stages')}
					>
						<Terminal size={15} />
						<span>Challenge Stages &amp; Target Runner</span>
					</button>

					<button
						class="arena-tab-btn"
						class:active={activeTab === 'scoreboard'}
						onclick={() => (activeTab = 'scoreboard')}
					>
						<Trophy size={15} />
						<span>Live Scoreboard (42 Teams)</span>
					</button>

					<button
						class="arena-tab-btn"
						class:active={activeTab === 'rules'}
						onclick={() => (activeTab = 'rules')}
					>
						<Shield size={15} />
						<span>Rules, Bounties &amp; FAQ</span>
					</button>
				</div>

				<!-- Enrolled Pass Pill -->
				<div class="team-status-pill">
					<span class="team-dot"></span>
					<span class="text-xs font-mono font-bold text-white">TEAM ALPHASEC</span>
					<span class="pass-badge">TEAM PASS ACTIVE</span>
				</div>
			</div>
		</header>

		<!-- ── TAB 1: CHALLENGE STAGES & TARGET RUNNER ──────── -->
		{#if activeTab === 'stages'}
			<div class="arena-grid">
				<!-- Left Column: 5 Progressive Stages -->
				<div class="stages-list-col">
					<div class="col-header-row">
						<h2 class="col-title">5 Progressive Challenge Stages</h2>
						<span class="text-xs text-slate-400">Sequential Flag Unlocking</span>
					</div>

					<div class="stages-stack">
						{#each stages as stage}
							<button
								type="button"
								class="stage-card"
								class:active={activeStageId === stage.id}
								class:solved={stage.solved}
								class:locked={stage.locked}
								onclick={() => {
									if (!stage.locked) activeStageId = stage.id;
								}}
							>
								<div class="stage-order-badge">
									{#if stage.solved}
										<CheckCircle2 size={16} class="text-emerald-400" />
									{:else if stage.locked}
										<Lock size={15} class="text-slate-500" />
									{:else}
										<span class="font-mono font-bold text-amber-400">0{stage.order}</span>
									{/if}
								</div>

								<div class="stage-info">
									<div class="stage-top-meta">
										<span class="stage-category">{stage.category}</span>
										<span class="stage-points">+{stage.points} PTS</span>
									</div>
									<h3 class="stage-name">{stage.title}</h3>
								</div>

								{#if stage.solved}
									<span class="stage-status-pill status-solved">SOLVED</span>
								{:else if stage.locked}
									<span class="stage-status-pill status-locked">LOCKED</span>
								{:else}
									<span class="stage-status-pill status-active">ACTIVE</span>
								{/if}
							</button>
						{/each}
					</div>

					<!-- Paid Registration / Checkout Card -->
					<div class="team-ticket-promo-card">
						<div class="promo-header">
							<div>
								<span class="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Registration Status</span>
								<h3 class="font-bold text-white text-base mt-0.5">HackDef 2026 Team Pass</h3>
							</div>
							<span class="ticket-price">₹1,499</span>
						</div>
						<p class="text-xs text-slate-400 leading-relaxed mt-2">
							Includes access for up to 4 team members, dedicated isolated AWS/K8s target machines, and eligibility for the ₹1,00,000 prize bounty.
						</p>
						<div class="promo-footer mt-4">
							<a href="/checkout/hackdef-2026-ctf-arena" class="btn-checkout-ticket">
								<span>Register Additional Team Ticket</span>
								<ArrowRight size={14} />
							</a>
						</div>
					</div>
				</div>

				<!-- Right Column: Active Challenge Detail & Machine Runner -->
				<div class="stage-runner-col">
					<!-- Active Stage Detail Card -->
					<div class="challenge-active-card">
						<div class="challenge-header">
							<div class="flex items-center gap-2">
								<span class="challenge-stage-tag font-mono">STAGE 0{activeStage.order}</span>
								<span class="text-xs text-slate-400 font-semibold">• {activeStage.category}</span>
							</div>

							<div class="challenge-points-badge">
								<Flame size={14} class="text-amber-400" />
								<span>{activeStage.points} PTS</span>
							</div>
						</div>

						<h2 class="challenge-title">{activeStage.title}</h2>
						<p class="challenge-desc">{activeStage.description}</p>

						<!-- Hint Disclosure -->
						<div class="hint-accordion">
							<button
								type="button"
								class="hint-toggle-btn"
								onclick={() => (showHint = !showHint)}
							>
								<HelpCircle size={14} class="text-sky-400" />
								<span>{showHint ? 'Hide Challenge Hint' : 'View Challenge Hint (-25 PTS penalty)'}</span>
							</button>
							{#if showHint}
								<div class="hint-body">
									<p class="text-xs text-sky-200 font-mono leading-relaxed">
										💡 {activeStage.hint}
									</p>
								</div>
							{/if}
						</div>

						<!-- Isolated Target Sandbox Controller -->
						<div class="sandbox-controller-box">
							<div class="sandbox-box-header">
								<div class="flex items-center gap-2">
									<span class="live-dot-green"></span>
									<span class="text-xs font-bold text-white tracking-wide uppercase font-mono">Isolated Target Machine</span>
								</div>
								<div class="flex items-center gap-2 font-mono text-xs text-slate-400">
									<Clock size={13} class="text-slate-400" />
									<span>TTL Lease: <strong class="text-amber-400">{timeRemaining}</strong></span>
								</div>
							</div>

							<div class="sandbox-ip-strip">
								<div class="ip-display">
									<span class="text-xs text-slate-400 font-mono">Target Host:</span>
									<code class="target-ip-code">{targetIp}</code>
									<span class="ports-text text-[11px] text-slate-500 font-mono">(8080/tcp, 2222/tcp)</span>
								</div>

								<div class="ip-actions">
									<button
										type="button"
										class="btn-copy-ip"
										onclick={copyIp}
										aria-label="Copy Target IP"
									>
										{#if copiedIp}
											<Check size={13} class="text-emerald-400" />
											<span class="text-xs text-emerald-400">Copied</span>
										{:else}
											<Copy size={13} />
											<span class="text-xs">Copy IP</span>
										{/if}
									</button>

									<button
										type="button"
										class="btn-restart"
										onclick={handleRestartMachine}
										title="Restart Machine"
									>
										<RotateCcw size={13} />
									</button>
								</div>
							</div>

							<!-- Runner Action Buttons -->
							<div class="sandbox-action-row">
								<button
									type="button"
									class="btn-launch-terminal"
									onclick={() => (showTerminal = true)}
								>
									<Terminal size={15} />
									<span>Launch In-Browser Terminal</span>
								</button>

								<a
									href="#rules"
									class="btn-vpn-config"
									onclick={() => alert('WireGuard credentials downloaded: hackdef-alphasec.conf')}
								>
									<FileCode size={14} />
									<span>WireGuard VPN Config</span>
								</a>
							</div>
						</div>

						<!-- Flag Submission Box -->
						<form class="flag-submit-form" onsubmit={handleSubmitFlag}>
							<label for="flagInput" class="flag-label">
								<span>Submit Captured Flag Token</span>
								<span class="text-xs font-mono text-slate-400 font-normal">Format: flag{'{'}...{'}'}</span>
							</label>

							<div class="flag-input-wrap">
								<Flag size={16} class="flag-icon" />
								<input
									id="flagInput"
									type="text"
									bind:value={flagInput}
									placeholder={'flag{hackdef_...}'}
									class="flag-input font-mono"
									autocomplete="off"
									spellcheck="false"
								/>
								<button type="submit" class="btn-submit-flag">
									<span>Submit Flag</span>
									<ArrowRight size={14} />
								</button>
							</div>

							{#if submissionStatus === 'success'}
								<div class="feedback-banner success">
									<CheckCircle2 size={16} class="text-emerald-400" />
									<span>{submissionFeedback}</span>
								</div>
							{:else if submissionStatus === 'error'}
								<div class="feedback-banner error">
									<X size={16} class="text-rose-400" />
									<span>{submissionFeedback}</span>
								</div>
							{/if}
						</form>
					</div>
				</div>
			</div>
		{/if}

		<!-- ── TAB 2: LIVE SCOREBOARD ───────────────────────── -->
		{#if activeTab === 'scoreboard'}
			<div class="scoreboard-view">
				<div class="scoreboard-header">
					<div>
						<h2 class="text-xl font-bold text-white">Live Leaderboard &amp; Solve Log</h2>
						<p class="text-xs text-slate-400 mt-1">Real-time team points, solve timing, and first blood bounties.</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="live-dot-green"></span>
						<span class="text-xs font-mono text-emerald-400 uppercase font-bold">Live Scoring Active</span>
					</div>
				</div>

				<div class="scoreboard-table-wrap">
					<table class="scoreboard-table">
						<thead>
							<tr>
								<th class="text-left w-16">Rank</th>
								<th class="text-left">Team Name</th>
								<th class="text-center w-24">Solves</th>
								<th class="text-center w-36">First Blood</th>
								<th class="text-right w-32">Last Solve</th>
								<th class="text-right w-36">Total Points</th>
							</tr>
						</thead>
						<tbody>
							{#each leaderboard as row}
								<tr class:user-row={row.isUser}>
									<td class="font-mono font-bold">
										{#if row.rank === 1}
											<span class="rank-badge gold">🥇 1</span>
										{:else if row.rank === 2}
											<span class="rank-badge silver">🥈 2</span>
										{:else if row.rank === 3}
											<span class="rank-badge bronze">🥉 3</span>
										{:else}
											<span class="text-slate-400 pl-2">#{row.rank}</span>
										{/if}
									</td>
									<td>
										<div class="flex items-center gap-2">
											<span class="font-bold text-white">{row.team}</span>
											{#if row.isUser}
												<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">YOUR TEAM</span>
											{/if}
										</div>
									</td>
									<td class="text-center font-mono text-slate-300">{row.solves} / 5</td>
									<td class="text-center">
										{#if row.firstBlood !== '—'}
											<span class="first-blood-pill">
												<Flame size={12} class="text-red-400" />
												<span>{row.firstBlood}</span>
											</span>
										{:else}
											<span class="text-slate-500 font-mono">—</span>
										{/if}
									</td>
									<td class="text-right font-mono text-xs text-slate-400">{row.lastSolve}</td>
									<td class="text-right font-mono font-bold text-amber-400 text-base">{row.points} PTS</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- ── TAB 3: RULES & BOUNTIES ──────────────────────── -->
		{#if activeTab === 'rules'}
			<div class="rules-view">
				<div class="rules-grid">
					<div class="rules-card">
						<div class="flex items-center gap-2 mb-3">
							<Trophy size={18} class="text-amber-400" />
							<h3 class="font-bold text-white text-base">Prize Pool &amp; Bounties</h3>
						</div>
						<ul class="rules-list">
							<li><strong>1st Place:</strong> ₹50,000 Cash + Progeta Certified Security Fellow + Trophies</li>
							<li><strong>2nd Place:</strong> ₹30,000 Cash + 1-Year Progeta LMS Access</li>
							<li><strong>3rd Place:</strong> ₹20,000 Cash + 6-Month Progeta LMS Access</li>
							<li><strong>First Blood Bonuses:</strong> +50 PTS awarded per stage for the earliest solve.</li>
						</ul>
					</div>

					<div class="rules-card">
						<div class="flex items-center gap-2 mb-3">
							<Shield size={18} class="text-sky-400" />
							<h3 class="font-bold text-white text-base">Rules of Engagement</h3>
						</div>
						<ul class="rules-list">
							<li>Attacking the competition scoreboard infrastructure or other teams' sandboxes is strictly prohibited.</li>
							<li>Each team may have 1 to 4 participants registered under the same ticket.</li>
							<li>Flags contain cryptographic team-specific tokens; flag-sharing leads to immediate disqualification.</li>
							<li>Bruteforce attempts on the flag submission gateway are throttled to 5 requests per minute.</li>
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- ── INTERACTIVE WEB TERMINAL MODAL ───────────────────────── -->
{#if showTerminal}
	<div class="terminal-modal-backdrop" onclick={() => (showTerminal = false)}>
		<div class="terminal-modal-window" onclick={(e) => e.stopPropagation()}>
			<div class="terminal-window-bar">
				<div class="window-dots">
					<span class="dot red" onclick={() => (showTerminal = false)}></span>
					<span class="dot yellow"></span>
					<span class="dot green"></span>
				</div>
				<span class="terminal-title">hacker@alphasec: ~ (Target: 10.10.14.204)</span>
				<button class="btn-close-term" onclick={() => (showTerminal = false)}>
					<X size={15} />
				</button>
			</div>

			<div class="terminal-content">
				{#each termLines as line}
					<div class="term-line font-mono text-xs">{line}</div>
				{/each}

				<div class="term-input-row">
					<span class="term-prompt font-mono text-xs text-emerald-400">hacker@alphasec:~$</span>
					<input
						type="text"
						bind:value={termInput}
						onkeydown={handleTermCommand}
						class="term-interactive-input font-mono text-xs"
						autofocus
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.hackathon-arena-root {
		min-height: 100vh;
		background: #080b11;
		color: #f8fafc;
		padding: 40px 0 80px 0;
	}

	.arena-container {
		max-width: 1380px;
		margin: 0 auto;
		padding: 0 24px;
	}

	/* Hero */
	.hackathon-hero {
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		padding: 32px;
		margin-bottom: 32px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
	}

	.hero-top-eyebrow {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.live-pulse-badge {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.35);
		color: #34d399;
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		padding: 4px 10px;
		border-radius: 999px;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 999px;
		box-shadow: 0 0 8px #10b981;
		animation: pulse-ring 1.5s infinite;
	}

	@keyframes pulse-ring {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.8); }
	}

	.eyebrow-sep {
		color: #475569;
		font-size: 0.8rem;
	}

	.prize-tag {
		font-size: 0.72rem;
		font-weight: 800;
		color: #f59e0b;
		background: rgba(245, 158, 11, 0.12);
		border: 1px solid rgba(245, 158, 11, 0.25);
		padding: 4px 10px;
		border-radius: 999px;
	}

	.hero-main-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 28px;
		align-items: center;
		margin-bottom: 28px;
	}

	@media (min-width: 992px) {
		.hero-main-row {
			grid-template-columns: 1.8fr 1fr;
		}
	}

	.hero-arena-title {
		font-size: clamp(1.8rem, 3.5vw, 2.5rem);
		font-weight: 800;
		letter-spacing: -0.025em;
		color: #ffffff;
		line-height: 1.2;
	}

	.hero-arena-desc {
		font-size: 0.92rem;
		color: #94a3b8;
		line-height: 1.6;
		margin-top: 12px;
		max-width: 720px;
	}

	.hero-stats-card {
		background: #111827;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 20px;
		display: flex;
		align-items: center;
		justify-content: space-around;
	}

	.stat-box {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: center;
	}

	.stat-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1.35rem;
		font-weight: 800;
	}

	.stat-divider {
		width: 1px;
		height: 36px;
		background: rgba(255, 255, 255, 0.08);
	}

	/* Tabs */
	.arena-tabs-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding-top: 20px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.tab-buttons {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.arena-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border-radius: 10px;
		background: transparent;
		border: 1px solid transparent;
		color: #94a3b8;
		font-size: 0.84rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.arena-tab-btn:hover {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.05);
	}

	.arena-tab-btn.active {
		color: #ffffff;
		background: #1e293b;
		border-color: rgba(255, 255, 255, 0.15);
	}

	.team-status-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 5px 12px;
		border-radius: 999px;
	}

	.team-dot {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: #38bdf8;
	}

	.pass-badge {
		font-size: 0.65rem;
		font-weight: 800;
		background: #10b981;
		color: #0b0f17;
		padding: 2px 6px;
		border-radius: 4px;
	}

	/* Arena Grid */
	.arena-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 28px;
	}

	@media (min-width: 992px) {
		.arena-grid {
			grid-template-columns: 1fr 1.6fr;
		}
	}

	.col-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.col-title {
		font-size: 1.1rem;
		font-weight: 800;
		color: #ffffff;
	}

	.stages-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.stage-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
		width: 100%;
	}

	.stage-card:hover:not(.locked) {
		background: #111827;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.stage-card.active {
		border-color: #38bdf8;
		background: rgba(56, 189, 248, 0.05);
	}

	.stage-card.solved {
		border-color: rgba(16, 185, 129, 0.3);
	}

	.stage-card.locked {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.stage-order-badge {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: #1e293b;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stage-info {
		flex: 1;
		min-width: 0;
	}

	.stage-top-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.stage-category {
		font-size: 0.7rem;
		font-weight: 700;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.stage-points {
		font-size: 0.72rem;
		font-weight: 800;
		color: #f59e0b;
		font-family: monospace;
	}

	.stage-name {
		font-size: 0.88rem;
		font-weight: 700;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stage-status-pill {
		font-size: 0.65rem;
		font-weight: 800;
		padding: 3px 8px;
		border-radius: 999px;
		font-family: monospace;
	}

	.status-solved {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
	}

	.status-active {
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
	}

	.status-locked {
		background: rgba(148, 163, 184, 0.1);
		color: #64748b;
	}

	/* Ticket Promo */
	.team-ticket-promo-card {
		margin-top: 24px;
		background: linear-gradient(135deg, #111827 0%, #0d121c 100%);
		border: 1px solid rgba(245, 158, 11, 0.25);
		border-radius: 16px;
		padding: 20px;
	}

	.promo-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.ticket-price {
		font-size: 1.25rem;
		font-weight: 800;
		color: #f59e0b;
		font-family: monospace;
	}

	.btn-checkout-ticket {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #f59e0b;
		color: #0b0f17;
		font-weight: 800;
		font-size: 0.82rem;
		padding: 10px 16px;
		border-radius: 10px;
		text-decoration: none;
		transition: background 0.15s ease;
		width: 100%;
		justify-content: center;
	}

	.btn-checkout-ticket:hover {
		background: #fbbf24;
	}

	/* Challenge Active Card */
	.challenge-active-card {
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		padding: 28px;
	}

	.challenge-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.challenge-stage-tag {
		font-size: 0.78rem;
		font-weight: 800;
		color: #38bdf8;
		background: rgba(56, 189, 248, 0.12);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.challenge-points-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.82rem;
		font-weight: 800;
		color: #f59e0b;
		font-family: monospace;
	}

	.challenge-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: #ffffff;
		margin-bottom: 12px;
	}

	.challenge-desc {
		font-size: 0.9rem;
		color: #94a3b8;
		line-height: 1.6;
		margin-bottom: 20px;
	}

	/* Hint */
	.hint-accordion {
		background: rgba(56, 189, 248, 0.05);
		border: 1px solid rgba(56, 189, 248, 0.15);
		border-radius: 10px;
		padding: 12px 16px;
		margin-bottom: 24px;
	}

	.hint-toggle-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: transparent;
		border: none;
		color: #38bdf8;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.hint-body {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid rgba(56, 189, 248, 0.15);
	}

	/* Sandbox Controller Box */
	.sandbox-controller-box {
		background: #111827;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 20px;
		margin-bottom: 28px;
	}

	.sandbox-box-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.live-dot-green {
		width: 7px;
		height: 7px;
		background: #10b981;
		border-radius: 999px;
		box-shadow: 0 0 6px #10b981;
	}

	.sandbox-ip-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #080b11;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		padding: 10px 16px;
		margin-bottom: 16px;
		flex-wrap: wrap;
		gap: 12px;
	}

	.ip-display {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.target-ip-code {
		font-size: 0.95rem;
		font-weight: 700;
		color: #ffffff;
		background: rgba(255, 255, 255, 0.06);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.ip-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-copy-ip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #1e293b;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
		padding: 6px 12px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
	}

	.btn-restart {
		background: #1e293b;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #94a3b8;
		padding: 7px 10px;
		border-radius: 8px;
		cursor: pointer;
	}

	.sandbox-action-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn-launch-terminal {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #38bdf8;
		color: #0b0f17;
		font-weight: 800;
		font-size: 0.82rem;
		padding: 10px 18px;
		border-radius: 10px;
		border: none;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.btn-launch-terminal:hover {
		background: #7dd3fc;
	}

	.btn-vpn-config {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
		font-size: 0.82rem;
		font-weight: 600;
		padding: 9px 16px;
		border-radius: 10px;
		text-decoration: none;
	}

	/* Flag Form */
	.flag-submit-form {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.flag-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.82rem;
		font-weight: 700;
		color: #e2e8f0;
	}

	.flag-input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	:global(.flag-icon) {
		position: absolute;
		left: 14px;
		color: #f59e0b;
	}

	.flag-input {
		width: 100%;
		height: 48px;
		background: #080b11;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 12px;
		padding: 0 140px 0 42px;
		color: #ffffff;
		font-size: 0.92rem;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.flag-input:focus {
		border-color: #f59e0b;
	}

	.btn-submit-flag {
		position: absolute;
		right: 6px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #f59e0b;
		color: #0b0f17;
		font-weight: 800;
		font-size: 0.8rem;
		padding: 8px 14px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
	}

	.feedback-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 600;
		margin-top: 6px;
	}

	.feedback-banner.success {
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid rgba(16, 185, 129, 0.3);
		color: #34d399;
	}

	.feedback-banner.error {
		background: rgba(244, 63, 94, 0.12);
		border: 1px solid rgba(244, 63, 94, 0.3);
		color: #fb7185;
	}

	/* Scoreboard Table */
	.scoreboard-view {
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		padding: 28px;
	}

	.scoreboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.scoreboard-table-wrap {
		overflow-x: auto;
	}

	.scoreboard-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}

	.scoreboard-table th {
		padding: 12px 16px;
		color: #64748b;
		font-size: 0.72rem;
		text-transform: uppercase;
		font-weight: 800;
		letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.scoreboard-table td {
		padding: 14px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.scoreboard-table tr.user-row {
		background: rgba(245, 158, 11, 0.08);
		border-left: 3px solid #f59e0b;
	}

	.first-blood-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: rgba(239, 68, 68, 0.15);
		color: #f87171;
		font-size: 0.7rem;
		font-weight: 800;
		font-family: monospace;
		padding: 2px 6px;
		border-radius: 4px;
	}

	/* Rules */
	.rules-view {
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		padding: 28px;
	}

	.rules-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}

	@media (min-width: 768px) {
		.rules-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.rules-card {
		background: #111827;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 14px;
		padding: 22px;
	}

	.rules-list {
		list-style: disc;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		color: #94a3b8;
		font-size: 0.85rem;
		line-height: 1.5;
	}

	/* Terminal Modal */
	.terminal-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.terminal-modal-window {
		width: 100%;
		max-width: 780px;
		background: #020617;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
	}

	.terminal-window-bar {
		background: #0f172a;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		padding: 10px 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.window-dots {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.window-dots .dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		cursor: pointer;
	}

	.dot.red { background: #ef4444; }
	.dot.yellow { background: #f59e0b; }
	.dot.green { background: #10b981; }

	.terminal-title {
		font-family: monospace;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.btn-close-term {
		background: transparent;
		border: none;
		color: #64748b;
		cursor: pointer;
	}

	.terminal-content {
		padding: 20px;
		height: 380px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.term-line {
		color: #cbd5e1;
		line-height: 1.4;
	}

	.term-input-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.term-interactive-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: #38bdf8;
		font-size: 0.8rem;
	}
</style>

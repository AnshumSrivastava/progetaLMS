<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowRight, BookOpen, GraduationCap, LayoutDashboard, Users } from 'lucide-svelte';
</script>

<svelte:head>
	<title>{APP_NAME} — Learn & Teach on Your Terms</title>
	<meta name="description" content="A premium learning management platform tailored for both instructors sharing expertise and students mastering new skills." />
</svelte:head>

<!-- Minimal Hero -->
<section style="padding: 120px 24px 100px; display: flex; flex-direction: column; align-items: center; text-align: center; background: radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 70%);">
	<div class="container" style="max-width: 800px;">
		<div class="chip animate-fade-up" style="margin-bottom: 24px;">
			Welcome to the future of learning
		</div>
		
		<h1 class="animate-fade-up delay-100" style="margin-bottom: 24px; font-size: clamp(2.5rem, 5vw, 4rem); letter-spacing: -0.03em; line-height: 1.1;">
			The intelligent platform for <br />
			<span style="color: var(--primary);">Educators</span> and <span style="color: var(--primary);">Learners</span>
		</h1>
		
		<p class="animate-fade-up delay-200" style="font-size: 1.125rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto 48px; line-height: 1.6;">
			Whether you're looking to master a new skill with verifiable credentials or you're an instructor aiming to share your expertise with the world, {APP_NAME} provides the perfect environment.
		</p>
	</div>
</section>

<!-- Dual Value Proposition Section -->
<section style="padding: 0 24px 120px;">
	<div class="container" style="max-width: 1000px;">
		<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
			
			<!-- For Students -->
			<div class="role-card animate-fade-up delay-300">
				<div class="role-icon" style="background: rgba(37, 99, 235, 0.1); color: #3b82f6;">
					<GraduationCap size={28} />
				</div>
				<h2>For Students</h2>
				<p>Access high-quality digital assets, take rigorous assessments, and earn cryptographic verifiable certificates. Learn at your own pace and own your learning journey permanently.</p>
				
				<ul class="feature-list">
					<li><ArrowRight size={16} /> Lifetime access to purchased resources</li>
					<li><ArrowRight size={16} /> Publicly verifiable certification pages</li>
					<li><ArrowRight size={16} /> 1-on-1 mentorship sessions</li>
				</ul>
				
				<div style="margin-top: auto; padding-top: 32px;">
					<Button variant="primary" size="lg" style="width: 100%; justify-content: center;">
						<a href="/sign-in?role=student" style="color: inherit; width: 100%;">Join as Student</a>
					</Button>
				</div>
			</div>

			<!-- For Teachers -->
			<div class="role-card animate-fade-up delay-400">
				<div class="role-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
					<LayoutDashboard size={28} />
				</div>
				<h2>For Instructors</h2>
				<p>Build your brand and monetize your knowledge. Create robust courses, issue recognized certificates, and manage a thriving community of dedicated learners.</p>
				
				<ul class="feature-list">
					<li><ArrowRight size={16} /> Sell digital assets & courses securely</li>
					<li><ArrowRight size={16} /> Automated certificate generation</li>
					<li><ArrowRight size={16} /> Comprehensive student analytics</li>
				</ul>
				
				<div style="margin-top: auto; padding-top: 32px;">
					<Button variant="secondary" size="lg" style="width: 100%; justify-content: center;">
						<a href="/sign-in?role=teacher" style="color: inherit; width: 100%;">Join as Teacher</a>
					</Button>
				</div>
			</div>

		</div>
	</div>
</section>

<style>
	.role-card {
		display: flex;
		flex-direction: column;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 40px;
		transition: all var(--t-fast);
		position: relative;
		overflow: hidden;
	}
	
	.role-card:hover {
		border-color: var(--border-strong);
		transform: translateY(-4px);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
	}
	
	.role-icon {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 24px;
	}
	
	.role-card h2 {
		font-size: 1.5rem;
		margin-bottom: 16px;
		font-weight: 600;
	}
	
	.role-card p {
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 24px;
		font-size: 0.9375rem;
	}
	
	.feature-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.feature-list li {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 0.875rem;
		color: var(--text-primary);
		font-weight: 500;
	}
	
	.feature-list li :global(svg) {
		color: var(--text-muted);
	}
</style>

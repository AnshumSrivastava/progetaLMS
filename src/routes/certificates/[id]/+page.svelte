<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	const metadata = data.certificate.metadata as any;
	const studentName = metadata.studentName || 'Student Name';
	const testName = metadata.testName || 'Course Name';
</script>

<svelte:head>
	<title>{studentName} - {testName} Certificate</title>
	<!-- Include fonts for web preview so the SVG text styling matches perfectly! -->
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
	<style>
		@media print {
			body { margin: 0; padding: 0; background: #ffffff !important; }
			.print-btn { display: none !important; }
			@page { size: landscape; margin: 0; }
		}
		
		body { margin: 0; padding: 0; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }

		.print-btn {
			position: fixed;
			bottom: 40px;
			right: 40px;
			z-index: 1000;
			background: rgba(255, 255, 255, 0.8);
			backdrop-filter: blur(12px);
			border: 1px solid rgba(255, 255, 255, 0.5);
			box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
			padding: 14px 24px;
			border-radius: 50px;
			color: #0f172a;
			font-family: 'Outfit', sans-serif;
			font-weight: 600;
			font-size: 1rem;
			display: flex;
			align-items: center;
			gap: 10px;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.print-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.15);
		}
		
		.svg-container {
			width: 100%;
			max-width: 1150px;
			background: white;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
			aspect-ratio: 1.414 / 1;
		}
	</style>
</svelte:head>

<a href="/certificates/{data.certificate.id}.pdf" target="_blank" rel="noopener noreferrer" class="print-btn" data-sveltekit-reload>
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="6 9 6 2 18 2 18 9"></polyline>
		<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
		<rect x="6" y="14" width="12" height="8"></rect>
	</svg>
	Download PDF
</a>

<div class="w-full flex items-center justify-center p-4 my-8">
	<div class="svg-container w-full rounded-xl overflow-hidden shadow-2xl">
		{@html data.svg}
	</div>
</div>

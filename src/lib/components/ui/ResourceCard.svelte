<script lang="ts">
	import { Download, BookOpen, ArrowRight, FileText } from 'lucide-svelte';

	let { resource }: { resource: any } = $props();

	const format = (resource.metadata?.format || resource.metadata?.fileType || 'PDF').toUpperCase();
	const pages = resource.metadata?.pages ? `${resource.metadata.pages} pages` : 'Guide';
	const targetUrl = $derived(`/catalog/${resource.slug || resource.id}`);
	const isFree = resource.pricePaise === 0;
	const priceDisplay = isFree ? 'Free' : `₹${(resource.pricePaise / 100).toFixed(0)}`;
</script>

<article class="rounded-3xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-md transition flex flex-col justify-between group">
	<div>
		<!-- 16:9 Cover Thumbnail -->
		<a href={targetUrl} class="block relative aspect-[16/9] overflow-hidden bg-zinc-100 border-b border-zinc-100">
			<img
				src={resource.metadata?.coverUrl || '/thumbnails/lab-guided.jpg'}
				alt={resource.title}
				class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>
			<div class="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
				<span class="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs bg-zinc-950 text-white">
					{format}
				</span>
				<span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-zinc-950 shadow-xs">
					{priceDisplay}
				</span>
			</div>
		</a>

		<!-- Body -->
		<div class="p-6">
			<div class="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
				<span>{resource.ownerName || 'Progeta Engineering'}</span>
				<span>&bull;</span>
				<span>{pages}</span>
			</div>

			<h3 class="text-lg font-bold text-zinc-950 leading-snug group-hover:text-zinc-700 transition">
				<a href={targetUrl}>
					{resource.title}
				</a>
			</h3>

			<p class="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
				{resource.description || 'Verified practical materials, technical blueprints, and reference frameworks.'}
			</p>
		</div>
	</div>

	<!-- Footer Action -->
	<div class="px-6 pb-6 pt-2 flex items-center justify-between border-t border-zinc-100 mt-auto">
		<span class="text-sm font-mono font-bold text-zinc-950">
			{priceDisplay}
		</span>
		<a
			href={targetUrl}
			class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition active:scale-95 shadow-xs"
		>
			<Download size={13} />
			<span>{isFree ? 'Download Free' : 'Get Resource'}</span>
		</a>
	</div>
</article>

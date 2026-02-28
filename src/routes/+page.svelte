<script lang="ts">
	import { onMount } from 'svelte';
	import ChartCore from '$lib/chart/ChartCore.svelte';
	import { mapPolygonToCandle } from '$lib/chart/mappers';
	import type { Candle } from '$lib/chart/types';

	let candles = $state<Candle[]>([]);
	let loading = $state(false);
	let error: string | null = $state(null);

	async function loadDate() {
		try {
			loading = true;
			error = null;

			const response = await fetch(
				'https://api.massive.com/v2/aggs/ticker/AAPL/range/1/minute/2025-11-01/2025-11-30?sort=asc&limit=15000&apiKey=oj3woDH8ZPPOWOVbYkvdmiYVJKqJXpb7'
			);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();
			candles = mapPolygonToCandle(data);
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	//Run only in browser
	onMount(() => {
		loadDate();
	});
</script>

<div class="p-10">
	<h1 class="mb-6 text-2xl font-bold">AAPL Chart</h1>
	{#if loading}
		<p>Loading...</p>
	{:else if error}
		<p class="text-red-500">Error: {error}</p>
	{:else}
		<ChartCore {candles} />
	{/if}
</div>

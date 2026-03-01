<script lang="ts">
	import ChartCore from './ChartCore.svelte';
	import ChartToolbar, { type Timeframe } from './ChartToolbar.svelte';
	import type { Candle } from './types';
	import { resampleCandles } from './resample';

	let {
		candles = []
	}: {
		candles: Candle[];
	} = $props();

	let activeTimeframe: Timeframe = $state('1m');

	let displayCandles = $derived(resampleCandles(candles, activeTimeframe));

	function handleTimeframeChange(tf: Timeframe) {
		activeTimeframe = tf;
		console.log('Timeframe changed to:', tf);
	}

	let vwapEnabled = $state(true);

	function toggleVWAP() {
		vwapEnabled = !vwapEnabled;
	}

	let emaEnabled = $state(false);

	function toggleEMA() {
		emaEnabled = !emaEnabled;
	}
</script>

<div class="container">
	<ChartToolbar
		active={activeTimeframe}
		onChange={handleTimeframeChange}
		vwapEnabled={vwapEnabled}
		onToggleVWAP={toggleVWAP}
		emaEnabled={emaEnabled}
		onToggleEMA={toggleEMA}
	/>

	<ChartCore candles={displayCandles} vwapEnabled={vwapEnabled} emaEnabled={emaEnabled} />
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
</style>

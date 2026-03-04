<script lang="ts">
	import ChartCore from './ChartCore.svelte';
	import ChartToolbar, { type Timeframe } from './ChartToolbar.svelte';
	import {runMockStrategy} from './engine/StrategyEngine';
	import type { Candle } from './types/market';

	import { resampleCandles } from './resample';
	import { useEffect } from 'storybook/internal/preview-api';

	let {
		candles = []
	}: {
		candles: Candle[];
	} = $props();

	let theme: 'dark' | 'light' = $state('dark');

	let activeTimeframe: Timeframe = $state('1m');

	let displayCandles:Candle[] = $derived(resampleCandles(candles, activeTimeframe));

	let strategy = $derived(runMockStrategy(displayCandles));

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}

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
		{theme}
		onToggleTheme={toggleTheme}
		{vwapEnabled}
		onToggleVWAP={toggleVWAP}
		{emaEnabled}
		onToggleEMA={toggleEMA}
	/>

	<ChartCore candles={displayCandles} signals={strategy.signals}
	strategyLevels={strategy.levels} {theme} {vwapEnabled} {emaEnabled} />
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
</style>

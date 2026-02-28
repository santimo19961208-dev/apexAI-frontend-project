<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		createChart,
		CandlestickSeries,
		LineSeries,
		type IChartApi,
		type CandlestickData,
		type LineData,
		type Time
	} from 'lightweight-charts';

	import type { Candle } from './types';

	const { candles } = $props<{ candles: Candle[] }>();

	let container: HTMLDivElement;
	let chart: IChartApi | undefined;
	let candleSeries: ReturnType<IChartApi['addSeries']> | undefined;
	let vwapSeries:ReturnType<IChartApi['addSeries']> | undefined;;
	let resizeObserver: ResizeObserver | undefined;

	onMount(() => {
		if (!container) return;

		// 1 Create chart
		chart = createChart(container, {
			layout: {
				background: { color: '#ffffff' },
				textColor: '#000000'
			}
		});

		// 2 Add candlestick series (NEW v5 way)
		candleSeries = chart.addSeries(CandlestickSeries);

		//6 VWAP line series
		vwapSeries = chart.addSeries(LineSeries, {
			color: '#2962FF',
			lineWidth: 2
		});

		// 3 Sample data
		// const sampleData: CandlestickData<Time>[] = [
		// 	{ time: 1700000000 as Time, open: 100, high: 110, low: 90, close: 105 },
		// 	{ time: 1700003600 as Time, open: 105, high: 115, low: 100, close: 112 },
		// 	{ time: 1700007200 as Time, open: 112, high: 120, low: 108, close: 118 }
		// ];

		// candleSeries.setData(sampleData);

		// chart.timeScale().fitContent();

		//4 Resize observer
		resizeObserver = new ResizeObserver((entries) => {
			if (!chart) return;

			const { width, height } = entries[0].contentRect;
			chart.applyOptions({ width, height });
		});

		resizeObserver.observe(container);
	});

	//5 Reactive update when candles change
	$effect(() => {
		if (!chart || !candleSeries || !vwapSeries) return;
		if (!candles || candles.length === 0) return;

		//Format candle data
		const formatted: CandlestickData<Time>[] = candles.map((c: Candle) => ({
			time: c.time as Time,
			open: c.open,
			high: c.high,
			low: c.low,
			close: c.close
		}));
		candleSeries.setData(formatted);

		//Format VWAP data (only if available)
		const vwapData:LineData<Time>[]=candles
			.filter((c:Candle)=>c.vwap !== undefined)
			.map((c:Candle)=>({
				time:c.time as Time,
				value:c.vwap!
			}));
		
		vwapSeries.setData(vwapData);

		chart?.timeScale().fitContent();
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		chart?.remove();
	});
</script>

<div bind:this={container} class="h-125 w-full"></div>

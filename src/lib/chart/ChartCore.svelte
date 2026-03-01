<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		createChart,
		CandlestickSeries,
		HistogramSeries,
		// LineSeries,
		type IChartApi,
		type ISeriesApi,
		// type CandlestickData,
		// type HistogramData,
		// type LineData,
		type Time
	} from 'lightweight-charts';

	let {
		candles = []
	}: {
		candles: Candle[];
	} = $props();

	import type { Candle } from './types';

	// const { candles } = $props<{ candles: Candle[] }>();

	let container: HTMLDivElement;
	let chart: IChartApi;
	let candleSeries: ISeriesApi<'Candlestick'>;
	let volumeSeries: ISeriesApi<'Histogram'>;
	// let vwapSeries:ReturnType<IChartApi['addSeries']> | undefined;;
	// let resizeObserver: ResizeObserver | undefined;

	// 7 Resize handler
	// function handleResize() {
	// 	if (!chart || !container) return;

	// 	chart.applyOptions({
	// 		width: container.clientWidth,
	// 		height: container.clientHeight
	// 	});
	// }

	function toVolumeData(data: Candle[]) {
		return data.map((d) => ({
			time: d.time,
			value: (d as any).volume ?? 0,
			color: d.close >= d.open ? '#22c55e' : '#ef4444'
		}));
	}

	onMount(() => {
		// if (!container) return;

		// 1 Create chart
		chart = createChart(container, {
			width: container.clientWidth,
			height: 500,
			layout: {
				background: { color: '#ffffff' },
				textColor: '#000000'
			},
			grid: {
				vertLines: { color: '#1e293b' },
				horzLines: { color: '#1e293b' }
			}
		});

		// 2 Add candlestick series (NEW v5 way)
		// candleSeries = chart.addSeries(CandlestickSeries);
		candleSeries = chart.addSeries(CandlestickSeries, {
			upColor: '#22c55e',
			downColor: '#ef4444',
			borderVisible: false,
			wickUpColor: '#22c55e',
			wickDownColor: '#ef4444'
		});

		//7 Add Volume Histogram Series
		volumeSeries = chart.addSeries(HistogramSeries, {
			priceFormat: {
				type: 'volume'
			},
			priceScaleId: 'volume'
		});

		// 8 Configure volume scale
		chart.priceScale('volume').applyOptions({
			scaleMargins: {
				top: 0.8, // Push volume to bottom 20%
				bottom: 0
			}
		});

		// // 9 Map candle data
		// const candleData: CandlestickData[] = candles.map((c: Candle) => ({
		// 	time: c.time,
		// 	open: c.open,
		// 	high: c.high,
		// 	low: c.low,
		// 	close: c.close
		// }));

		// const volumeData: HistogramData[] = candles.map((c: Candle) => ({
		// 	time: c.time,
		// 	value: c.volume,
		// 	color: c.close >= c.open ? '#22c55e' : '#ef4444'
		// }));
		if (candles.length) {
			candleSeries.setData(candles);
			volumeSeries.setData(toVolumeData(candles));
			chart.timeScale().fitContent();
		}

		// window.addEventListener('resize', handleResize);

		// return () => {
		// 	window.removeEventListener('resize', handleResize);
		// };

		//6 VWAP line series
		// vwapSeries = chart.addSeries(LineSeries, {
		// 	color: '#2962FF',
		// 	lineWidth: 2
		// });

		// 3 Sample data
		// const sampleData: CandlestickData<Time>[] = [
		// 	{ time: 1700000000 as Time, open: 100, high: 110, low: 90, close: 105 },
		// 	{ time: 1700003600 as Time, open: 105, high: 115, low: 100, close: 112 },
		// 	{ time: 1700007200 as Time, open: 112, high: 120, low: 108, close: 118 }
		// ];

		// candleSeries.setData(sampleData);

		// chart.timeScale().fitContent();

		//4 Resize observer
		// resizeObserver = new ResizeObserver((entries) => {
		// 	if (!chart) return;

		// 	const { width, height } = entries[0].contentRect;
		// 	chart.applyOptions({ width, height });
		// });

		// resizeObserver.observe(container);
	});

	let previousLength = 0;
	let previousLastTime: Time | undefined;

	$effect(() => {
		if (!candleSeries || !candles?.length) return;

		const last = candles[candles.length - 1];

		// First load
		if (previousLength === 0) {
			candleSeries.setData(candles);
			volumeSeries.setData(toVolumeData(candles));
		}
		// Append new candle
		else if (candles.length > previousLength) {
			candleSeries.update(last);
			volumeSeries.update({
				time: last.time,
				value: (last as any).volume ?? 0,
				color: last.close >= last.open ? '#22c55e' : '#ef4444'
			});
		}
		// Update current candle
		else if (last.time === previousLastTime) {
			candleSeries.update(last);
			volumeSeries.update({
				time: last.time,
				value: (last as any).volume ?? 0,
				color: last.close >= last.open ? '#22c55e' : '#ef4444'
			});
		}
		// Full reset (timeframe change etc.)
		else {
			candleSeries.setData(candles);
			volumeSeries.setData(toVolumeData(candles));
		}

		previousLength = candles.length;
		previousLastTime = last.time;
	});

	//5 Reactive update when candles change
	// $effect(() => {
	// 	if (!chart || !candleSeries || !vwapSeries) return;
	// 	if (!candles || candles.length === 0) return;

	//Format candle data
	// const formatted: CandlestickData<Time>[] = candles.map((c: Candle) => ({
	// 	time: c.time as Time,
	// 	open: c.open,
	// 	high: c.high,
	// 	low: c.low,
	// 	close: c.close
	// }));
	// candleSeries.setData(formatted);

	//Format VWAP data (only if available)
	// const vwapData:LineData<Time>[]=candles
	// 	.filter((c:Candle)=>c.vwap !== undefined)
	// 	.map((c:Candle)=>({
	// 		time:c.time as Time,
	// 		value:c.vwap!
	// 	}));

	// vwapSeries.setData(vwapData);

	// chart?.timeScale().fitContent();
	// });

	onDestroy(() => {
		if (chart) {
			chart.remove;
		}
		// resizeObserver?.disconnect();
	});
</script>

<div bind:this={container} class="chart-container"></div>

<style>
	.chart-container {
		width: 100%;
		height: 500px;
	}
</style>

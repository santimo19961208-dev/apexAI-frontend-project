<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		createChart,
		CandlestickSeries,
		HistogramSeries,
		LineSeries,
		createSeriesMarkers,
		type IChartApi,
		type ISeriesApi,
		type Time
	} from 'lightweight-charts';

	import { IndicatorEngine } from './engine/IndicatorEngine';
	import { calculateEMA } from './indicators/ema';
	import { mapVWAP } from './indicators/vwap';

	import type { Candle } from './types/market';
	import type { StrategySignal, StrategyLevels } from './types/strategy';

	let {
		candles = [],
		vwapEnabled = false,
		emaEnabled = false,
		signals = [],
		strategyLevels = {},
		theme = 'dark'
	}: {
		candles: Candle[];
		vwapEnabled: boolean;
		emaEnabled: boolean;
		signals: StrategySignal[];
		strategyLevels: StrategyLevels;
		theme: 'dark' | 'light';
	} = $props();

	let container: HTMLDivElement;
	let chart: IChartApi;
	let candleSeries: ISeriesApi<'Candlestick'>;
	let volumeSeries: ISeriesApi<'Histogram'>;

	let resizeObserver: ResizeObserver;

	let previousLength = 0;
	let previousLastTime: Time | undefined;
	let previousCandlesRef: Candle[] | null = null;

	let lastPriceLine: ReturnType<typeof candleSeries.createPriceLine> | null = null;

	let open: number | undefined = $state(undefined);
	let high: number | undefined = $state(undefined);
	let low: number | undefined = $state(undefined);
	let close: number | undefined = $state(undefined);
	let volume: number | undefined = $state(undefined);

	let indicatorEngine: IndicatorEngine;

	// let tooltipVisible = $state(false);
	// let tooltipX = $state(0);
	// let tooltipY = $state(0);

	// let tooltipClose: number | undefined = $state(undefined);
	// let tooltipVolume: number | undefined = $state(undefined);
	// let tooltipVwap: number | undefined = $state(undefined);

	// let tooltipElement: HTMLDivElement | null = $state(null);

	function toVolumeData(data: Candle[]) {
		return data.map((d) => ({
			time: d.time,
			value: d.volume ?? 0,
			color: d.close >= d.open ? 'rgba(22,163,74,0.4)' : 'rgba(220,38,38,0.4)'
		}));
	}

	function handleMouseLeave() {
		// tooltipVisible = false;
		open = high = low = close = volume = undefined;
	}

	function handleDoubleClick() {
		chart.timeScale().fitContent();
	}

	function drawSignals() {
		if (!signals.length) return;

		createSeriesMarkers(
			candleSeries,
			signals.map((s) => ({
				time: s.time as Time,
				position: s.side === 'long' ? 'belowBar' : 'aboveBar',
				color: s.side === 'long' ? '#22c55e' : '#ef4444',
				shape: s.side === 'long' ? 'arrowUp' : 'arrowDown'
			}))
		);
	}

	function drawLevels() {
		function drawLine(price: number, color: string) {
			const line = chart.addSeries(LineSeries, {
				color,
				lineWidth: 1,
				lineStyle: 2 // dashed
			});

			line.setData([
				{ time: candles[0].time, value: price },
				{ time: candles[candles.length - 1].time, value: price }
			]);
		}

		if (strategyLevels.entry) drawLine(strategyLevels.entry, '#3b82f6');

		if (strategyLevels.stop) drawLine(strategyLevels.stop, '#ef4444');

		if (strategyLevels.take) drawLine(strategyLevels.take, '#22c55e');
	}

	//Mount
	onMount(() => {
		chart = createChart(container, {
			width: container.clientWidth,
			height: 500
		});

		candleSeries = chart.addSeries(CandlestickSeries, {
			upColor: '#16a34a',
			downColor: '#dc2626',
			borderVisible: false,
			wickUpColor: '#16a34a',
			wickDownColor: '#dc2626',

			priceLineVisible: true,
			lastValueVisible: true,
			priceLineColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
			priceLineWidth: 1
		});

		volumeSeries = chart.addSeries(HistogramSeries, {
			priceFormat: {
				type: 'volume'
			},
			priceScaleId: 'volume'
		});

		drawSignals();
		drawLevels();

		chart.subscribeCrosshairMove((param) => {
			if (!param.point || !param.time) {
				open = high = low = close = volume = undefined;
				return;
			}

			const candleData = param.seriesData.get(candleSeries);
			const volumeData = param.seriesData.get(volumeSeries);

			if (!candleData) {
				return;
			}

			// Candle typing (strict safe cast)
			const candle = candleData as {
				open: number;
				high: number;
				low: number;
				close: number;
			};

			open = candle.open;
			high = candle.high;
			low = candle.low;
			close = candle.close;

			volume =
				typeof volumeData === 'object' && volumeData !== null && 'value' in volumeData
					? (volumeData as { value: number }).value
					: undefined;
		});

		chart.priceScale('volume').applyOptions({
			scaleMargins: {
				top: 0.8, // Push volume to bottom 20%
				bottom: 0
			}
		});

		if (candles.length) {
			candleSeries.setData(candles);
			volumeSeries.setData(toVolumeData(candles));
			chart.timeScale().fitContent();
		}

		if (candles.length > 0) {
			const last = candles[candles.length - 1];

			lastPriceLine = candleSeries.createPriceLine({
				price: last.close,
				color: last.close >= last.open ? '#22c55e' : '#ef4444',
				lineWidth: 1,
				lineStyle: 2,
				axisLabelVisible: true,
				title: ''
			});
		}

		indicatorEngine = new IndicatorEngine(chart);

		$effect(() => {
			if (!indicatorEngine) return;

			if (vwapEnabled) {
				indicatorEngine.addLineIndicator('vwap', '#2563eb', mapVWAP);
			} else {
				indicatorEngine.removeIndicator('vwap');
			}

			if (emaEnabled) {
				indicatorEngine.addLineIndicator('ema20', '#f59e0b', (data) => calculateEMA(data, 20));
			} else {
				indicatorEngine.removeIndicator('ema20');
			}

			indicatorEngine.setAll(candles);
		});

		// Resize Observer
		resizeObserver = new ResizeObserver((entries) => {
			if (!chart) return;

			const { width, height } = entries[0].contentRect;

			chart.applyOptions({
				width,
				height
			});
		});

		resizeObserver.observe(container);

		container.addEventListener('dblclick', handleDoubleClick);
	});

	$effect(() => {
		if (!chart) return;

		chart.applyOptions({
			layout: {
				background: {
					color: theme === 'dark' ? '#0b1220' : '#f8fafc'
				},
				textColor: theme === 'dark' ? '#e2e8f0' : '#111827'
			},
			grid: {
				vertLines: {
					color: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.05)'
				},
				horzLines: {
					color: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.05)'
				}
			},
			crosshair: {
				mode: 1,
				vertLine: {
					color: theme === 'dark' ? 'rgba(148,163,184,0.4)' : 'rgba(0,0,0,0.3)',
					width: 1,
					style: 2
				},
				horzLine: {
					color: theme === 'dark' ? 'rgba(148,163,184,0.4)' : 'rgba(0,0,0,0.3)',
					width: 1,
					style: 2
				}
			},
			rightPriceScale: {
				borderColor: 'rgba(255,255,255,0.1)',
				scaleMargins: {
					top: 0.1,
					bottom: 0.1
				}
			},
			timeScale: {
				borderColor: 'rgba(255,255,255,0.1)'
			},
			handleScroll: {
				mouseWheel: true,
				pressedMouseMove: true,
				horzTouchDrag: true,
				vertTouchDrag: false
			},
			handleScale: {
				axisPressedMouseMove: {
					time: true,
					price: false
				},
				mouseWheel: true,
				pinch: true
			}
		});
	});

	//Main Update Engine
	$effect(() => {
		if (!candleSeries || !candles?.length) return;

		const isNewDataset = previousCandlesRef !== candles;
		const last = candles[candles.length - 1];

		if (isNewDataset) {
			previousLength = 0;
		}

		if (previousLength === 0) {
			candleSeries.setData(candles);
			volumeSeries.setData(toVolumeData(candles));

			if (indicatorEngine) {
				indicatorEngine.setAll(candles);
			}
		} else if (candles.length > previousLength) {
			candleSeries.update(last);
			volumeSeries.update({
				time: last.time,
				value: last.volume ?? 0,
				color: last.close >= last.open ? '#22c55e' : '#ef4444'
			});

			if (indicatorEngine) {
				indicatorEngine.updateOneAll(candles);
			}
		} else if (last.time === previousLastTime) {
			candleSeries.update(last);
			volumeSeries.update({
				time: last.time,
				value: last.volume ?? 0,
				color: last.close >= last.open ? '#22c55e' : '#ef4444'
			});
			if (indicatorEngine) {
				indicatorEngine.updateOneAll(candles);
			}
		} else {
			candleSeries.setData(candles);
			volumeSeries.setData(toVolumeData(candles));

			if (indicatorEngine) {
				indicatorEngine.setAll(candles);
			}
		}

		previousLength = candles.length;
		previousLastTime = last.time;
		previousCandlesRef = candles;

		if (lastPriceLine) {
			candleSeries.removePriceLine(lastPriceLine);

			lastPriceLine = candleSeries.createPriceLine({
				price: last.close,
				color: last.close >= last.open ? '#22c55e' : '#ef4444',
				lineWidth: 1,
				lineStyle: 2,
				axisLabelVisible: true,
				title: ''
			});
		}
	});

	//Destroy
	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}

		if (chart) {
			chart.remove();
		}

		container?.removeEventListener('mouseleave', handleMouseLeave);
		container?.removeEventListener('dblclick', handleDoubleClick);
	});
</script>

<div class="wrapper">
	<div
		class="ohlc"
		class:up={close !== undefined && open !== undefined && close >= open}
		class:down={close !== undefined && open !== undefined && close < open}
	>
		O: {open?.toFixed(2) ?? '--'}
		H: {high?.toFixed(2) ?? '--'}
		L: {low?.toFixed(2) ?? '--'}
		C: {close?.toFixed(2) ?? '--'}
		v: {volume?.toFixed(2) ?? '--'}
	</div>

	<div class="chart-area">
		<div bind:this={container} class="chart-container"></div>
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		height: 100%;
		font-family: Inter, system-ui, sans-serif;
	}

	.chart-area {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.chart-container {
		width: 100%;
		height: 100%;
	}

	.ohlc {
		font-size: 14px;
		font-weight: 500;
		display: flex;
		gap: 16px;
	}

	.up {
		color: #22c55e;
	}

	.down {
		color: #ef4444;
	}
</style>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		createChart,
		CandlestickSeries,
		HistogramSeries,
		LineSeries,
		type IChartApi,
		type ISeriesApi,
		type Time,
		type LineData
	} from 'lightweight-charts';

	let {
		candles = [],
		vwapEnabled = false,
		emaEnabled = false
	}: {
		candles: Candle[];
		vwapEnabled: boolean;
		emaEnabled: boolean;
	} = $props();

	import type { Candle } from './types';

	let container: HTMLDivElement;
	let chart: IChartApi;
	let candleSeries: ISeriesApi<'Candlestick'>;
	let volumeSeries: ISeriesApi<'Histogram'>;

	let resizeObserver: ResizeObserver;

	//Indicator Engine
	type Indicator = {
		create: () => void;
		setData: (data: Candle[]) => void;
		update: (last: Candle) => void;
		destroy: () => void;
	};

	const indicators = new Map<string, Indicator>();

	let vwapSeries: ISeriesApi<'Line'> | null = null;
	let emaSeries: ISeriesApi<'Line'> | null = null;

	let previousLength = 0;
	let previousLastTime: Time | undefined;
	let previousCandlesRef: Candle[] | null = null;

	let lastPriceLine: ReturnType<typeof candleSeries.createPriceLine> | null = null;

	let open: number | undefined = $state(undefined);
	let high: number | undefined = $state(undefined);
	let low: number | undefined = $state(undefined);
	let close: number | undefined = $state(undefined);

	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	let tooltipClose: number | undefined = $state(undefined);
	let tooltipVolume: number | undefined = $state(undefined);
	let tooltipVwap: number | undefined = $state(undefined);

	let tooltipElement: HTMLDivElement | null = $state(null);

	function toVolumeData(data: Candle[]) {
		return data.map((d) => ({
			time: d.time,
			value: (d as any).volume ?? 0,
			color: d.close >= d.open ? '#22c55e' : '#ef4444'
		}));
	}

	function handleMouseLeave() {
		tooltipVisible = false;
		open = high = low = close = undefined;
	}

	function handleDoubleClick() {
		chart.timeScale().fitContent();
	}

	//VWAP Indicator
	const vwapIndicator: Indicator = {
		create() {
			if (!chart || vwapSeries) return;

			vwapSeries = chart.addSeries(LineSeries, {
				color: '#3b82f6',
				lineWidth: 2,
				priceLineVisible: false,
				lastValueVisible: true
			});
		},

		setData(data: Candle[]) {
			if (!vwapSeries) return;

			const vwapData: LineData<Time>[] = data
				.filter((c) => c.vwap !== undefined)
				.map((c) => ({
					time: c.time,
					value: c.vwap as number
				}));

			vwapSeries.setData(vwapData);
		},

		update(last: Candle) {
			if (!vwapSeries || last.vwap === undefined) return;

			vwapSeries.update({
				time: last.time,
				value: last.vwap
			} as LineData<Time>);
		},

		destroy() {
			if (!chart || !vwapSeries) return;

			chart.removeSeries(vwapSeries);
			vwapSeries = null;
		}
	};

	//EMA Indicator (20)
	function calculateEMA(data: Candle[], period: number) {
		const k = 2 / (period + 1);
		const result: LineData<Time>[] = [];

		let ema: number | undefined;

		for (let i = 0; i < data.length; i++) {
			const close = data[i].close;

			if (i === 0) {
				ema = close;
			} else {
				ema = close * k + (ema as number) * (1 - k);
			}

			result.push({
				time: data[i].time,
				value: ema
			});
		}

		return result;
	}

	const emaIndicator: Indicator = {
		create() {
			if (!chart || emaSeries) return;

			emaSeries = chart.addSeries(LineSeries, {
				color: '#f59e0b',
				lineWidth: 2,
				priceLineVisible: false,
				lastValueVisible: true
			});
		},

		setData(data: Candle[]) {
			if (!emaSeries) return;

			const emaData = calculateEMA(data, 20);
			emaSeries.setData(emaData);
		},

		update(last: Candle) {
			if (!emaSeries) return;

			// easiest safe approach → recompute full EMA
			const emaData = calculateEMA(candles, 20);
			emaSeries.setData(emaData);
		},

		destroy() {
			if (!chart || !emaSeries) return;

			chart.removeSeries(emaSeries);
			emaSeries = null;
		}
	};

	//Mount
	onMount(() => {
		chart = createChart(container, {
			width: container.clientWidth,
			height: 500,
			layout: {
				background: { color: '#ffffff' },
				textColor: '#000000'
			},
			grid: {
				vertLines: { color: 'rgba(148, 163, 184, 0.8)', style: 1 }, //dashed
				horzLines: { color: 'rgba(148, 163, 184, 0.8)', style: 1 }
			},
			crosshair: {
				mode:1, // Magnet mode
				vertLine: {
					color: 'rgba(148, 163, 184, 0.4)',
					width: 1,
					style: 1,
					labelVisible: false
				},

				horzLine: {
					color: 'rgba(148, 163, 184, 0.4)',
					width: 1,
					style: 1,
					labelVisible: true,
					labelBackgroundColor: '#1e293b'
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

		candleSeries = chart.addSeries(CandlestickSeries, {
			upColor: '#22c55e',
			downColor: '#ef4444',
			borderVisible: false,
			wickUpColor: '#22c55e',
			wickDownColor: '#ef4444',

			priceLineVisible: true,
			lastValueVisible: true
		});

		volumeSeries = chart.addSeries(HistogramSeries, {
			priceFormat: {
				type: 'volume'
			},
			priceScaleId: 'volume'
		});

		chart.subscribeCrosshairMove((param) => {
			if (!param.point || !param.time) {
				tooltipVisible = false;
				open = high = low = close = undefined;
				return;
			}

			const candleData = param.seriesData.get(candleSeries);
			const volumeData = param.seriesData.get(volumeSeries);
			const vwapData = vwapSeries ? param.seriesData.get(vwapSeries) : undefined;

			if (!candleData) {
				tooltipVisible = false;
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

			tooltipClose = candle.close;
			tooltipVolume =
				typeof volumeData === 'object' && volumeData !== null && 'value' in volumeData
					? (volumeData as { value: number }).value
					: undefined;

			tooltipVwap =
				typeof vwapData === 'object' && vwapData !== null && 'value' in vwapData
					? (vwapData as { value: number }).value
					: undefined;

			tooltipVisible = true;

			// initial position
			let x = param.point.x + 12;
			let y = param.point.y + 12;

			const containerRect = container.getBoundingClientRect();
			const tooltipRect = tooltipElement?.getBoundingClientRect();

			if (tooltipRect) {
				// Prevent overflow right
				if (x + tooltipRect.width > containerRect.width) {
					x = param.point.x - tooltipRect.width - 12;
				}

				// Prevent overflow bottom
				if (y + tooltipRect.height > containerRect.height) {
					y = param.point.y - tooltipRect.height - 12;
				}
			}

			tooltipX = x;
			tooltipY = y;
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

		// 🔥 Resize Observer
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

	//VWAP Toggle Lifecycle
	$effect(() => {
		if (!chart) return;

		if (vwapEnabled) {
			if (!indicators.has('vwap')) {
				vwapIndicator.create();
				vwapIndicator.setData(candles);
				indicators.set('vwap', vwapIndicator);
			}
		} else {
			if (indicators.has('vwap')) {
				vwapIndicator.destroy();
				indicators.delete('vwap');
			}
		}
	});

	//EMA Toggle Lifecycle
	$effect(() => {
		if (!chart) return;

		if (emaEnabled) {
			if (!indicators.has('ema')) {
				emaIndicator.create();
				emaIndicator.setData(candles);
				indicators.set('ema', emaIndicator);
			}
		} else {
			if (indicators.has('ema')) {
				emaIndicator.destroy();
				indicators.delete('ema');
			}
		}
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

			indicators.forEach((indicator) => {
				indicator.setData(candles);
			});
		} else if (candles.length > previousLength) {
			candleSeries.update(last);
			volumeSeries.update({
				time: last.time,
				value: (last as any).volume ?? 0,
				color: last.close >= last.open ? '#22c55e' : '#ef4444'
			});

			indicators.forEach((indicator) => {
				indicator.update(last);
			});
		} else if (last.time === previousLastTime) {
			candleSeries.update(last);
			volumeSeries.update({
				time: last.time,
				value: (last as any).volume ?? 0,
				color: last.close >= last.open ? '#22c55e' : '#ef4444'
			});

			indicators.forEach((indicator) => {
				indicator.update(last);
			});
		} else {
			candleSeries.setData(candles);
			volumeSeries.setData(toVolumeData(candles));

			indicators.forEach((indicator) => {
				indicator.setData(candles);
			});
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
	</div>

	<div class="chart-area">
		<div bind:this={container} class="chart-container"></div>

		{#if tooltipVisible}
			<div
				bind:this={tooltipElement}
				class="tooltip"
				style="transform: translate(${tooltipX}px, ${tooltipY}px)"
			>
				<div>Close: {tooltipClose?.toFixed(2) ?? '--'}</div>
				<div>VWAP: {tooltipVwap?.toFixed(2) ?? '--'}</div>
				<div>Volume: {tooltipVolume?.toLocaleString() ?? '--'}</div>
			</div>
		{/if}
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

	.tooltip {
		position: absolute;
		background: rgba(15, 23, 42, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 12px;
		color: #e2e8f0;
		pointer-events: none;
		backdrop-filter: blur(6px);
		white-space: nowrap;
	}
</style>

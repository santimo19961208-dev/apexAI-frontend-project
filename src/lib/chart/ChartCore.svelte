<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		createChart,
		CandlestickSeries,
		type IChartApi,
		type CandlestickData,
		type Time
	} from 'lightweight-charts';

	let container: HTMLDivElement;
	let chart: IChartApi | undefined;
	let candleSeries: ReturnType<IChartApi['addSeries']> | undefined;

	onMount(() => {
		if (!container) return;

		// 1️⃣ Create chart
		chart = createChart(container, {
			width: container.clientWidth,
			height: 500,
			layout: {
				background: { color: '#ffffff' },
				textColor: '#000000'
			},
			grid: {
				vertLines: { color: '#e1e1e1' },
				horzLines: { color: '#e1e1e1' }
			}
		});

		// 2️⃣ Add candlestick series (NEW v5 way)
		candleSeries = chart.addSeries(CandlestickSeries);

		// 3️⃣ Sample data
		const sampleData: CandlestickData<Time>[] = [
			{ time: 1700000000 as Time, open: 100, high: 110, low: 90, close: 105 },
			{ time: 1700003600 as Time, open: 105, high: 115, low: 100, close: 112 },
			{ time: 1700007200 as Time, open: 112, high: 120, low: 108, close: 118 }
		];

		candleSeries.setData(sampleData);

		chart.timeScale().fitContent();
	});

	onDestroy(() => {
		chart?.remove();
		chart = undefined;
	});
</script>

<div bind:this={container} class="w-full"></div>

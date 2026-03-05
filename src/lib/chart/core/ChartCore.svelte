<script lang="ts">
import { onMount, onDestroy } from 'svelte'
import { SvelteMap } from 'svelte/reactivity'

import {
    createChart,
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
    createSeriesMarkers,
    LineStyle,
    type IChartApi,
    type ISeriesApi,
    type SeriesMarker,
    type LineData,
    type LineWidth,
    type WhitespaceData,
    type Time
} from 'lightweight-charts'

import type { Candle } from '../types/market'
import type { StrategySignal } from '../types/strategy'
import type { OverlayOptions, OverlayPoint } from '../api/ChartAPI'

let container: HTMLDivElement
let chart: IChartApi

let candleSeries: ISeriesApi<'Candlestick'>
let volumeSeries: ISeriesApi<'Histogram'>

let resizeObserver: ResizeObserver

let lastPriceLine: ReturnType<typeof candleSeries.createPriceLine> | null = null

let open: number | undefined = $state(undefined)
let high: number | undefined = $state(undefined)
let low: number | undefined = $state(undefined)
let close: number | undefined = $state(undefined)
let volume: number | undefined = $state(undefined)

const overlays = new SvelteMap<
    string,
    ISeriesApi<'Line', Time, LineData<Time> | WhitespaceData<Time>>
>()

/* ===============================
   Candle API
================================ */

export function setCandles(candles: Candle[]) {

    candleSeries.setData(candles)

    volumeSeries.setData(
        candles.map(c => ({
            time: c.time,
            value: c.volume ?? 0,
            color: c.close >= c.open
                ? 'rgba(22,163,74,0.4)'
                : 'rgba(220,38,38,0.4)'
        }))
    )

    const last = candles[candles.length - 1]

    if (!last) return

    if (lastPriceLine) {
        candleSeries.removePriceLine(lastPriceLine)
    }

    lastPriceLine = candleSeries.createPriceLine({
        price: last.close,
        color: last.close >= last.open ? '#22c55e' : '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: ''
    })

    chart.timeScale().fitContent()
}

export function updateCandle(candle: Candle) {

    candleSeries.update(candle)

    volumeSeries.update({
        time: candle.time,
        value: candle.volume ?? 0,
        color: candle.close >= candle.open
            ? '#22c55e'
            : '#ef4444'
    })

    if (lastPriceLine) {
        candleSeries.removePriceLine(lastPriceLine)
    }

    lastPriceLine = candleSeries.createPriceLine({
        price: candle.close,
        color: candle.close >= candle.open ? '#22c55e' : '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: ''
    })
}

/* ===============================
   Signals
================================ */

const markers: SeriesMarker<Time>[] = []

export function addSignal(signal: StrategySignal) {

    const marker: SeriesMarker<Time> = {
        time: signal.time as Time,
        position: signal.side === 'long' ? 'belowBar' : 'aboveBar',
        color: signal.side === 'long' ? '#22c55e' : '#ef4444',
        shape: signal.side === 'long' ? 'arrowUp' : 'arrowDown',
        text: signal.side.toUpperCase(),
        price: signal.price
    }

    markers.push(marker)

    createSeriesMarkers(candleSeries, markers)
}

export function clearSignals() {

    markers.length = 0

    createSeriesMarkers(candleSeries, markers)
}

/* ===============================
   Overlays
================================ */

export function createOverlay(id: string, options?: OverlayOptions) {

    if (overlays.has(id)) return

    const series = chart.addSeries(LineSeries, {
        color: options?.color ?? '#f59e0b',
        lineWidth: (options?.lineWidth ?? 2) as LineWidth,
        lineStyle: LineStyle.Solid
    })

    overlays.set(id, series)
}

export function updateOverlay(id: string, point: OverlayPoint) {

    const series = overlays.get(id)

    if (!series) return

    series.update({
        time: point.time,
        value: point.value
    })
}

export function removeOverlay(id: string) {

    const series = overlays.get(id)

    if (!series) return

    chart.removeSeries(series)

    overlays.delete(id)
}

/* ===============================
   Chart lifecycle
================================ */

function handleDoubleClick() {
    chart.timeScale().fitContent()
}

onMount(() => {

    chart = createChart(container, {
        width: container.clientWidth,
        height: 500
    })

    candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#16a34a',
        downColor: '#dc2626',
        borderVisible: false,
        wickUpColor: '#16a34a',
        wickDownColor: '#dc2626',
        priceLineVisible: true,
        lastValueVisible: true,
        priceLineColor: '#3b82f6',
        priceLineWidth: 1
    })

    volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume'
    })

    chart.priceScale('volume').applyOptions({
        scaleMargins: {
            top: 0.8,
            bottom: 0
        }
    })

    chart.subscribeCrosshairMove(param => {

        if (!param.point || !param.time) {
            open = high = low = close = volume = undefined
            return
        }

        const candleData = param.seriesData.get(candleSeries)
        const volumeData = param.seriesData.get(volumeSeries)

        if (!candleData) return

        const candle = candleData as {
            open: number
            high: number
            low: number
            close: number
        }

        open = candle.open
        high = candle.high
        low = candle.low
        close = candle.close

        volume =
            typeof volumeData === 'object' &&
            volumeData !== null &&
            'value' in volumeData
                ? (volumeData as { value: number }).value
                : undefined
    })

    resizeObserver = new ResizeObserver(entries => {

        if (!chart) return

        const { width, height } = entries[0].contentRect

        chart.applyOptions({ width, height })

    })

    resizeObserver.observe(container)

    container.addEventListener('dblclick', handleDoubleClick)

})

onDestroy(() => {

    resizeObserver?.disconnect()

    if (chart) {
        chart.remove()
    }

    container?.removeEventListener('dblclick', handleDoubleClick)

})
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
        V: {volume?.toFixed(2) ?? '--'}
    </div>

    <div class="chart-area">
        <div bind:this={container} class="chart-container"></div>
    </div>

</div>


<style>
.wrapper{
    display:flex;
    flex-direction:column;
    gap:8px;
    width:100%;
    height:100%;
    font-family:Inter,system-ui,sans-serif;
}

.chart-area{
    position:relative;
    width:100%;
    height:100%;
}

.chart-container{
    width:100%;
    height:100%;
}

.ohlc{
    font-size:14px;
    font-weight:500;
    display:flex;
    gap:16px;
}

.up{
    color:#22c55e;
}

.down{
    color:#ef4444;
}
</style>
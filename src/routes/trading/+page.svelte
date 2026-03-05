<script lang="ts">

import { onMount } from 'svelte'
import Chart from '$lib/chart/Chart.svelte'
import type { ChartAPI } from '$lib/chart/api/ChartAPI'

import { MarketDataService } from '$lib/services/api.client'
import { MarketWebSocket } from '$lib/services/websocket.client'
import type {Candle} from '$lib/chart/types/market'


let chart: ChartAPI | null = null
const ws = new MarketWebSocket()


function handleReady(api: ChartAPI) {
    chart = api
}

async function loadHistory() {

    if (!chart) return

    const candles = await MarketDataService.fetchCandles(
        "AAPL",
        "minute",
        "2025-11-01",
        "2025-11-30"
    )

    chart.setCandles(candles)

}

function startLiveFeed() {

    ws.connect('AAPL', '1m')

    ws.subscribe((candle: Candle) => {

        if (!chart) return

        chart.updateCandle(candle)

    })

}

onMount(async () => {

    await loadHistory()

    startLiveFeed()

})


</script>

<Chart onReady={handleReady}/>

<!-- 
Example backend response (Polygon):

{
  "t": 1700000000000,
  "o": 100,
  "h": 105,
  "l": 98,
  "c": 103,
  "v": 1000
}

Backend WebSocket Message Format

Your backend should send:

{
  "t": 1700000000000,
  "o": 100,
  "h": 101,
  "l": 99,
  "c": 100.5,
  "v": 200
} -->
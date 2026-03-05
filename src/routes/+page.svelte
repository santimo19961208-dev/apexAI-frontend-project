<script lang="ts">

import { onMount } from 'svelte'
import Chart from '$lib/chart/Chart.svelte'
import type { ChartAPI } from '$lib/chart/api/ChartAPI'
import { mapPolygonToCandle } from '$lib/chart/utils/mappers'

let chart: ChartAPI | null = null

function handleReady(api: ChartAPI) {
    chart = api
    loadHistory()
}

async function loadHistory() {

    if (!chart) return

    const res = await fetch('https://api.massive.com/v2/aggs/ticker/AAPL/range/1/minute/2025-11-01/2025-11-30?sort=asc&limit=15000&apiKey=oj3woDH8ZPPOWOVbYkvdmiYVJKqJXpb7')

    const json = await res.json()

    const candles = mapPolygonToCandle(json)

    chart.setCandles(candles)

}

onMount(() => {
    loadHistory()
})

</script>

<Chart onReady={handleReady}/>
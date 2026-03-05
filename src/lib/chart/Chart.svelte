<script lang="ts">

import { onMount } from 'svelte'
import ChartCore from './core/ChartCore.svelte'
import { ChartController } from './controller/ChartController'
import type { ChartAPI } from './api/ChartAPI'

let core: ChartCore
let controller: ChartController

// event callback
let { onReady }: { onReady?: (api: ChartAPI) => void } = $props()

onMount(() => {

    // create controller and connect to core
    controller = new ChartController(core)

    // expose API to parent
    onReady?.(controller)

})

</script>


<ChartCore bind:this={core} />
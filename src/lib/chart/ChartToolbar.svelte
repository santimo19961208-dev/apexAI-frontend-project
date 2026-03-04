<script lang="ts">
	export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';

	let {
		active,
		onChange,
		vwapEnabled,
		onToggleVWAP,
		emaEnabled,
		onToggleEMA,
		theme,
		onToggleTheme
	}: {
		active: Timeframe;
		onChange: (tf: Timeframe) => void;
		vwapEnabled: boolean;
		onToggleVWAP: () => void;
		emaEnabled: boolean;
		onToggleEMA: () => void;
		theme: 'dark' | 'light';
		onToggleTheme: () => void;
	} = $props();

	const timeframes: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D'];

	function select(tf: Timeframe) {
		onChange(tf);
	}

</script>

<div class="toolbar" data-theme={theme}>
	{#each timeframes as tf}
		<button class:selected={tf === active} onclick={() => select(tf)}>
			{tf}
		</button>
	{/each}

	<hr />

	<button class:selected={vwapEnabled} onclick={onToggleVWAP}> VWAP </button>
	<button class:selected={emaEnabled} onclick={onToggleEMA}> EMA 20</button>

	<hr />

	<button onclick={onToggleTheme}>
		{theme === 'dark' ? '☀ Light' : '🌙 Dark'}
	</button>
</div>

<style>
	.toolbar {
		display: flex;
		gap: 6px;
		padding: 6px 0;
		align-items: center;
	}

	button {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #d1d5db;
		padding: 4px 10px;
		font-size: 12px;
		border-radius: 4px;
		cursor: pointer;
	}

	button:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	button.selected {
		background: #1e293b;
		border-color: rgba(255, 255, 255, 0.2);
	}

	hr {
		border: none;
		width: 1px;
		height: 20px;
		background: rgba(255, 255, 255, 0.1);
		margin: 0 6px;
	}

	/* LIGHT THEME */
	.toolbar[data-theme='light'] button {
		color: #111827;
		border-color: rgba(0, 0, 0, 0.1);
	}

	.toolbar[data-theme='light'] button:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.toolbar[data-theme='light'] button.selected {
		background: #e5e7eb;
		border-color: rgba(0, 0, 0, 0.2);
	}
</style>

import type { Candle } from './types/market';
import type { Timeframe } from './ChartToolbar.svelte';
import type { UTCTimestamp } from 'lightweight-charts';

const timeframeToMinutes: Record<Timeframe, number> = {
	'1m': 1,
	'5m': 5,
	'15m': 15,
	'1H': 60,
	'4H': 240,
	'1D': 1440
};

export function resampleCandles(
	base: Candle[],
	timeframe: Timeframe
): Candle[] {
	if (timeframe === '1m') return base;

	const interval = timeframeToMinutes[timeframe] * 60;
	const result: Candle[] = [];

	let bucket: Candle[] = [];
	let bucketStart: number | null = null;

	for (const candle of base) {
		const timestamp = candle.time as number;

		const aligned =
			Math.floor(timestamp / interval) * interval;

		if (bucketStart === null) {
			bucketStart = aligned;
		}

		if (aligned !== bucketStart) {
			result.push(aggregate(bucket, bucketStart));
			bucket = [];
			bucketStart = aligned;
		}

		bucket.push(candle);
	}

	if (bucket.length && bucketStart !== null) {
		result.push(aggregate(bucket, bucketStart));
	}

	return result;
}

function aggregate(
	group: Candle[],
	time: number
): Candle {
	const totalVolume = group.reduce(
		(sum, c) => sum + c.volume,
		0
	);

	const totalTrades = group.reduce(
		(sum, c) => sum + (c.tradCount ?? 0),
		0
	);

	const weightedPriceSum = group.reduce(
		(sum, c) =>
			sum + (c.vwap ?? c.close) * c.volume,
		0
	);

	const vwap =
		totalVolume > 0
			? weightedPriceSum / totalVolume
			: undefined;

	return {
		time: time as UTCTimestamp,
		open: group[0].open,
		close: group[group.length - 1].close,
		high: Math.max(...group.map(c => c.high)),
		low: Math.min(...group.map(c => c.low)),
		volume: totalVolume,
		vwap,
		tradCount: totalTrades
	};
}
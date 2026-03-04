import type { Time } from 'lightweight-charts';
import type { Candle } from '../types';

export type EMAStateful = {
	init: (candles: Candle[]) => { time: Time; value: number }[];
	update: (candle: Candle) => { time: Time; value: number } | null;
	reset: () => void;
};

export function createEMA(period: number): EMAStateful {
	const k: number = 2 / (period + 1);

	let confirmedEMA: number | undefined;
	let lastTime: Time | undefined;

	function reset() {
		confirmedEMA = undefined;
		lastTime = undefined;
	}

	function computeEMA(close: number, prev: number): number {
		return close * k + prev * (1 - k);
	}

	function init(candles: Candle[]): { time: Time; value: number }[] {
		reset();

		const result: { time: Time; value: number }[] = [];

		if (candles.length < period) return result;

		// 1️⃣ Initial SMA
		let sum = 0;
		for (let i = 0; i < period; i++) {
			sum += candles[i].close;
		}

		const sma: number = sum / period;

		confirmedEMA = sma;
		lastTime = candles[period - 1].time;

		result.push({
			time: lastTime,
			value: sma
		});

		// 2️⃣ Process remaining candles
		for (let i = period; i < candles.length; i++) {
			if (confirmedEMA === undefined) break;

			confirmedEMA = computeEMA(candles[i].close, confirmedEMA);

			lastTime = candles[i].time;

			result.push({
				time: lastTime,
				value: confirmedEMA
			});
		}

		return result;
	}

	function update(candle: Candle): { time: Time; value: number } | null {
		if (confirmedEMA === undefined) return null;

		// 🟢 New candle
		if (lastTime !== candle.time) {
			confirmedEMA = computeEMA(candle.close, confirmedEMA);

			lastTime = candle.time;

			return {
				time: candle.time,
				value: confirmedEMA
			};
		}

		// 🟡 Same candle update (no state mutation)
		const recalculated: number = computeEMA(candle.close, confirmedEMA);

		return {
			time: candle.time,
			value: recalculated
		};
	}

	return {
		init,
		update,
		reset
	};
}

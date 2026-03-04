import type { Candle } from '../types';
import type { LineData, Time } from 'lightweight-charts';

export function calculateEMA(
	data: Candle[],
	period: number
): LineData<Time>[] {
	if (!data.length) return [];

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
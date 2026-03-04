import type { Candle } from '../types';
import type { LineData, Time } from 'lightweight-charts';

export function mapVWAP(
	data: Candle[]
): LineData<Time>[] {
	return data
		.filter(c => c.vwap !== undefined)
		.map(c => ({
			time: c.time,
			value: c.vwap as number
		}));
}
import type { Candle } from '../types/market';
import type { StrategySignal, StrategyLevels } from '../types/strategy';

export function runMockStrategy(candles: Candle[]) {
	if (candles.length < 50) return { signals: [], levels: {} };

	const last = candles[candles.length - 1];

	const signal: StrategySignal = {
		id: 'mock_1',
		time: last.time,
		side: last.close > last.open ? 'long' : 'short',
		price: last.close
	};

	const levels: StrategyLevels =
		signal.side === 'long'
			? {
					entry: last.close,
					stop: last.close - 1,
					take: last.close + 2
			  }
			: {
					entry: last.close,
					stop: last.close + 1,
					take: last.close - 2
			  };

	return {
		signals: [signal],
		levels
	};
}
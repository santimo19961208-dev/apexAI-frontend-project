import type { UTCTimestamp } from "lightweight-charts";

export type SignalSide = 'long' | 'short';

export interface StrategySignal {
	id: string;
	time: UTCTimestamp;
	side: SignalSide;
	price: number;
}

export interface StrategyLevels {
	entry?: number;
	stop?: number;
	take?: number;
}
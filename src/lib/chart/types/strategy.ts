export type SignalSide = 'long' | 'short';

export interface StrategySignal {
	id: string;
	time: number;
	side: SignalSide;
	price: number;
}

export interface StrategyLevels {
	entry?: number;
	stop?: number;
	take?: number;
}
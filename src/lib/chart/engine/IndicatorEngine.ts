import type { Candle } from '../types/market';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { LineSeries } from 'lightweight-charts';

type IndicatorInstance = {
	id: string;
	series: ISeriesApi<'Line'>;
	setData: (data: Candle[]) => void;
	updateOne: (data: Candle[]) => void;
	destroy: () => void;
};

export class IndicatorEngine {
	private chart: IChartApi;
	private indicators = new Map<string, IndicatorInstance>();

	constructor(chart: IChartApi) {
		this.chart = chart;
	}

	addLineIndicator(
		id: string,
		color: string,
		calc: (data: Candle[]) => { time: Time; value: number }[]
	) {
		if (this.indicators.has(id)) return;

		const series = this.chart.addSeries(LineSeries, {
			color,
			lineWidth: 2,
			priceLineVisible: false,
			lastValueVisible: true
		});

		const instance: IndicatorInstance = {
			id,
			series,
			setData: (data) => {
				series.setData(calc(data));
			},

			updateOne: (data) => {
				const result = calc(data);
				const last = result[result.length - 1];
				if (last) {
					series.update(last);
				}
			},
			destroy: () => {
				this.chart.removeSeries(series);
			}
		};

		this.indicators.set(id, instance);
	}

	removeIndicator(id: string) {
		const instance = this.indicators.get(id);
		if (!instance) return;

		instance.destroy();
		this.indicators.delete(id);
	}

	setAll(data: Candle[]) {
		this.indicators.forEach((i) => i.setData(data));
	}

	updateOneAll(data: Candle[]) {
		this.indicators.forEach((i) => i.updateOne(data));
	}
}

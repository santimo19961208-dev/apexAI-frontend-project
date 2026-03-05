import type { Candle } from '$lib/chart/types/market'
import type { StrategySignal } from '$lib/chart/types/strategy'
import type { UTCTimestamp } from "lightweight-charts"

export interface OverlayPoint {
  time: UTCTimestamp
  value: number
}

export interface OverlayOptions {
  color?: string
  lineWidth?: number
}

export interface ChartAPI {

  setCandles(candles: Candle[]): void

  updateCandle(candle: Candle): void

  addSignal(signal: StrategySignal): void

  clearSignals(): void

  addOverlay(id: string, options?: OverlayOptions): void

  updateOverlay(id: string, point: OverlayPoint): void

  removeOverlay(id: string): void

}
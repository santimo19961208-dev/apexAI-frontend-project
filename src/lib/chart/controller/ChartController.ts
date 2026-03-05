import type { ChartAPI, OverlayOptions, OverlayPoint } from "../api/ChartAPI"
import type { Candle } from "../types/market"
import type { StrategySignal } from "../types/strategy"
import type ChartCore from "../core/ChartCore.svelte"

export class ChartController implements ChartAPI {

  private core: ChartCore

  constructor(core: ChartCore) {
    this.core = core
  }

  setCandles(candles: Candle[]): void {
    this.core.setCandles(candles)
  }

  updateCandle(candle: Candle): void {
    this.core.updateCandle(candle)
  }

  addSignal(signal: StrategySignal): void {
    this.core.addSignal(signal)
  }

  clearSignals(): void {
    this.core.clearSignals()
  }

  addOverlay(id: string, options?: OverlayOptions): void {
    this.core.createOverlay(id, options)
  }

  updateOverlay(id: string, point: OverlayPoint): void {
    this.core.updateOverlay(id, point)
  }

  removeOverlay(id: string): void {
    this.core.removeOverlay(id)
  }

}
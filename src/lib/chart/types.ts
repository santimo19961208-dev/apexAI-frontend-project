import type { UTCTimestamp } from "lightweight-charts";

export interface Candle{
    time: UTCTimestamp; //unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume:number;

    vwap?: number;
    tradCount?: number;
}
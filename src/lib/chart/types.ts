export interface Candle{
    time: number; //unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume:number;

    vwap?: number;
    tradCount?: number;
}
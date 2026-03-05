import type { UTCTimestamp } from 'lightweight-charts';
import type {Candle} from '../types/market';
interface PolygonAgg{
    t:number;
    o:number;
    h:number;
    l:number;
    c:number;
    v:number;
}

interface PolygonResponse{
    results?:PolygonAgg[];
}


export function mapPolygonToCandle(apiResponse:PolygonResponse):Candle[]{
    if(!apiResponse.results) return [];

    return apiResponse.results.map((item) => ({
        time: (item.t/1000) as UTCTimestamp, // Convert milliseconds to seconds
        
        open: item.o,
        high: item.h,
        low: item.l,
        close: item.c,

        volume: item.v,
    }));
}

export function mapBackendCandle(raw: PolygonAgg): Candle {

    return {
        time: Math.floor(raw.t / 1000) as UTCTimestamp,
        open: raw.o,
        high: raw.h,
        low: raw.l,
        close: raw.c,
        volume: raw.v
    }

}
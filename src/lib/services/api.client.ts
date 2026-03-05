import { mapPolygonToCandle } from '$lib/chart/utils/mappers'
import type { Candle } from '$lib/chart/types/market'

const BASE_URL = "https://api.massive.com/v2"

export class MarketDataService {

    static async fetchCandles(
        symbol: string,
        timeframe: string,
        from: string,
        to: string
    ): Promise<Candle[]> {

        const url = `${BASE_URL}/aggs/ticker/${symbol}/range/1/${timeframe}/${from}/${to}?sort=asc&limit=50000&apiKey=oj3woDH8ZPPOWOVbYkvdmiYVJKqJXpb7`

        const res = await fetch(url)

        const json = await res.json()

        return mapPolygonToCandle(json)

    }

}
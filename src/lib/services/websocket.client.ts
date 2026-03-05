import type { Candle } from '$lib/chart/types/market'

export type CandleListener = (candle: Candle) => void

export class MarketWebSocket {

    private socket: WebSocket | null = null
    private listeners: CandleListener[] = []

    connect(symbol: string, timeframe: string) {

        const url = `ws://localhost:8080/ws/market?symbol=${symbol}&tf=${timeframe}`

        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
            console.log('WS connected')
        }

        this.socket.onmessage = (event: MessageEvent<string>) => {

            const data = JSON.parse(event.data) as Candle

            this.listeners.forEach(cb => cb(data))

        }

        this.socket.onclose = () => {
            console.log('WS closed')
        }

        this.socket.onerror = (err) => {
            console.error('WS error', err)
        }
    }

    subscribe(listener: CandleListener) {
        this.listeners.push(listener)
    }

    disconnect() {
        this.socket?.close()
    }
}
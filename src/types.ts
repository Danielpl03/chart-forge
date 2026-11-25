export type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number };
export type ExchangeId = 'binance' | 'bybit' | 'bitunix';
export type Interval = '1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d';
export type IndicatorKind = 'EMA'|'SMA'|'BOLLINGER'|'RSI'|'MACD'|'VOLUME';
export type IndicatorConfig = { id: string; kind: IndicatorKind; period: number; enabled: boolean };
export type ChartConfig = { id:string; exchange:ExchangeId; symbol:string; interval:Interval; indicators:IndicatorConfig[] };
export type DrawingTool = { id: string; type: string; points: {time:number;price:number}[]; style?: Record<string,unknown> };
export interface ExchangeAdapter {
 id: ExchangeId; label: string;
 fetchCandles(symbol:string, interval:Interval, limit?:number):Promise<Candle[]>;
 subscribeTrades(symbol:string, onTrade:(price:number, timestamp:number, quantity:number)=>void, onStatus:(s:string)=>void):()=>void;
}

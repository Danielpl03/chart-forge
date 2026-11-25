export type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number };
export type ExchangeId = 'binance' | 'bybit' | 'bitunix';
export type Interval = '1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d';
export type IndicatorKind = 'EMA'|'SMA'|'BOLLINGER'|'RSI'|'MACD'|'VOLUME';
export type IndicatorConfig = { id: string; kind: IndicatorKind; period: number; enabled: boolean };
export type ChartConfig = { id:string; exchange:ExchangeId; symbol:string; interval:Interval; indicators:IndicatorConfig[] };
export type Asset = { exchange:ExchangeId; symbol:string; base:string; quote:string; price?:number; change24h?:number; volume24h?:number };
export type Watchlist = { id:string; name:string; assets:Asset[] };
export type PriceAlert = { id:string; exchange:ExchangeId; symbol:string; condition:'above'|'below'; target:number; enabled:boolean; triggeredAt?:number };
export type DrawingTool = { id: string; type: string; points: {time:number;price:number}[]; style?: Record<string,unknown> };
export interface ExchangeAdapter {
 id: ExchangeId; label: string;
 fetchCandles(symbol:string, interval:Interval, limit?:number):Promise<Candle[]>;
 searchAssets(query?:string):Promise<Asset[]>;
 getLastPrice(symbol:string):Promise<number>;
 subscribeTrades(symbol:string, onTrade:(price:number, timestamp:number, quantity:number)=>void, onStatus:(s:string)=>void):()=>void;
}

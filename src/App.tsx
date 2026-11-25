import {useEffect,useMemo,useRef,useState} from 'react';
import Chart from './Chart';
import {exchanges} from './exchanges';
import type {Candle,ChartConfig,ExchangeId,IndicatorConfig,IndicatorKind,Interval} from './types';

const intervals:Interval[]=['1m','5m','15m','30m','1h','4h','1d'];
const STORAGE_KEY='chartforge.workspace.v1';\nconst LAYOUT_KEY='chartforge.layout.v1';\nconst NAME_KEY='chartforge.name.v1';
const defaultIndicators=():IndicatorConfig[]=>[{id:crypto.randomUUID(),kind:'VOLUME',period:20,enabled:true}];
const newChart=(symbol='BTCUSDT',exchange:ExchangeId='binance'):ChartConfig=>({id:crypto.randomUUID(),exchange,symbol,interval:'1h',indicators:defaultIndicators()});
function loadWorkspace():ChartConfig[]{try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return[newChart()];const parsed=JSON.parse(raw);if(!Array.isArray(parsed)||!parsed.length)return[newChart()];return parsed.map((x:any)=>({...x,id:String(x.id||crypto.randomUUID()),exchange:exchanges[x.exchange as ExchangeId]?x.exchange:'binance',symbol:String(x.symbol||'BTCUSDT'),interval:intervals.includes(x.interval)?x.interval:'1h',indicators:Array.isArray(x.indicators)?x.indicators.filter((i:any)=>i&&['EMA','SMA','BOLLINGER','RSI','MACD','VOLUME'].includes(i.kind)).map((i:any)=>({id:String(i.id||crypto.randomUUID()),kind:i.kind,period:Math.max(2,Math.min(500,Number(i.period)||20)),enabled:i.enabled!==false})):[]}));}catch{return[newChart()];}}
function ChartPanel({config,onChange,onClose,canClose}:{config:ChartConfig;onChange:(patch:Partial<ChartConfig>)=>void;onClose:()=>void;canClose:boolean}){
 const [data,setData]=useState<Candle[]>([]),[status,setStatus]=useState('Conectando…'),[error,setError]=useState('');
 const [csvData,setCsvData]=useState<Candle[]>([]),[csvName,setCsvName]=useState('');
 const [kind,setKind]=useState<IndicatorKind>('EMA'),[period,setPeriod]=useState(20);
 const generation=useRef(0);
 useEffect(()=>{let active=true;const generationId=++generation.current;let stop:(()=>void)|undefined;setData([]);setError('');setStatus('Cargando histórico…');
 const adapter=exchanges[config.exchange];
 (async()=>{try{const history=await adapter.fetchCandles(config.symbol,config.interval,500);if(!active||generation.current!==generationId)return;setData(history);
 const seconds:Record<Interval,number>={'1m':60,'5m':300,'15m':900,'30m':1800,'1h':3600,'4h':14400,'1d':86400};const duration=seconds[config.interval];let current=history.at(-1);
 stop=adapter.subscribeTrades(config.symbol,(price,ts,qty)=>{if(!active)return;const time=Math.floor(ts/1000/duration)*duration;if(!current||time>current.time){current={time,open:price,high:price,low:price,close:price,volume:qty};setData(prev=>[...prev,current!]);}else if(time===current.time){current={...current,high:Math.max(current.high,price),low:Math.min(current.low,price),close:price,volume:(current.volume??0)+qty};setData(prev=>{const next=prev.slice();if(next.length)next[next.length-1]=current!;return next;});}},setStatus);
 }catch(e){if(active){setError(e instanceof Error?e.message:String(e));setStatus('Sin conexión');}}})();
 return()=>{active=false;stop?.();};},[config.exchange,config.symbol,config.interval]);
 const last=data.at(-1),prev=data.at(-2),pct=last&&prev?(last.close-prev.close)/prev.close*100:0;
 const addIndicator=()=>onChange({indicators:[...config.indicators,{id:crypto.randomUUID(),kind,period,enabled:true}]});
 const importCsv=async(file?:File)=>{if(!file)return;try{const {parseCandlesCsv}=await import('./csv');setCsvData(await parseCandlesCsv(file));setCsvName(file.name);}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const updateIndicator=(id:string,patch:Partial<IndicatorConfig>)=>onChange({indicators:config.indicators.map(i=>i.id===id?{...i,...patch}:i)});
 return <article className="chart-card">
  <div className="chart-card-head">
   <div className="chart-identity"><span className={`status-dot ${status==='Conectado'?'ok':''}`}/><b>{config.symbol}</b><small>{config.exchange.toUpperCase()} · {config.interval}</small>{last&&<strong className={pct>=0?'positive':'negative'}>{last.close.toLocaleString('en-US',{maximumFractionDigits:8})} ({pct>=0?'+':''}{pct.toFixed(2)}%)</strong>}</div>
   <div className="chart-actions"><select aria-label="Exchange" value={config.exchange} onChange={e=>onChange({exchange:e.target.value as ExchangeId})}><option value="binance">Binance</option><option value="bybit">Bybit</option><option value="bitunix">Bitunix</option></select><input aria-label="Símbolo" className="symbol-input" value={config.symbol} onChange={e=>onChange({symbol:e.target.value.toUpperCase().trim()})}/><select aria-label="Temporalidad" value={config.interval} onChange={e=>onChange({interval:e.target.value as Interval})}>{intervals.map(x=><option key={x}>{x}</option>)}</select>{canClose&&<button className="icon-button" title="Cerrar gráfico" onClick={onClose}>×</button>}</div>
  </div>
  <div className="chart-meta"><span>{status}</span><span>{data.length} velas</span>{error&&<span className="error-inline">{error}</span>}</div>
  <Chart data={data} indicators={config.indicators.filter(i=>i.enabled)} height={330}/>
  <div className="indicator-manager">
   <div className="indicator-list">{config.indicators.map(i=><span className="indicator-chip" key={i.id}><input type="checkbox" checked={i.enabled} onChange={e=>updateIndicator(i.id,{enabled:e.target.checked})}/>{i.kind}{['EMA','SMA','BOLLINGER','RSI'].includes(i.kind)?` ${i.period}`:''}<button title="Eliminar indicador" onClick={()=>onChange({indicators:config.indicators.filter(x=>x.id!==i.id)})}>×</button></span>)}</div>
   <div className="add-indicator"><select value={kind} onChange={e=>setKind(e.target.value as IndicatorKind)}>{(['EMA','SMA','BOLLINGER','RSI','MACD','VOLUME'] as IndicatorKind[]).map(x=><option key={x}>{x}</option>)}</select><input aria-label="Periodo" type="number" min="2" max="500" value={period} onChange={e=>setPeriod(Math.max(2,Number(e.target.value)||2))}/><button onClick={addIndicator}>＋ Indicador</button><label className="csv-import">CSV<input type="file" accept=".csv,text/csv" onChange={e=>importCsv(e.target.files?.[0])}/></label></div>
  </div>
  {csvData.length>0&&<div className="csv-preview"><div className="csv-head"><b>Histórico CSV · {csvName}</b><span>{csvData.length} velas</span><button onClick={()=>{setCsvData([]);setCsvName('')}}>Quitar</button></div><Chart data={csvData} height={210}/></div>}
 </article>;
}

export default function App(){
 const [charts,setCharts]=useState<ChartConfig[]>(loadWorkspace);
 const [layout,setLayout]=useState<1|2|4>(2);
 const [workspaceName,setWorkspaceName]=useState('Mi espacio');
 const [savedAt,setSavedAt]=useState('');
 useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(charts));localStorage.setItem(LAYOUT_KEY,String(layout));localStorage.setItem(NAME_KEY,workspaceName);setSavedAt(new Date().toLocaleTimeString());}catch{setSavedAt('No se pudo guardar');}},[charts,layout,workspaceName]);
 const patch=(id:string,patch:Partial<ChartConfig>)=>setCharts(prev=>prev.map(c=>c.id===id?{...c,...patch}:c));
 const add=()=>setCharts(prev=>[...prev,newChart(prev.length%2?'ETHUSDT':'BTCUSDT',prev.length%2?'bybit':'binance')]);
 const remove=(id:string)=>setCharts(prev=>prev.filter(c=>c.id!==id));
 const reset=()=>{if(confirm('¿Restablecer el espacio y eliminar sus gráficos guardados?')){localStorage.removeItem(STORAGE_KEY);setCharts([newChart()]);}};
 const exportWorkspace=()=>{const blob=new Blob([JSON.stringify({version:1,name:workspaceName,charts},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='chartforge-workspace.json';a.click();URL.revokeObjectURL(url);};
 const importWorkspace=async(file?:File)=>{if(!file)return;try{const parsed=JSON.parse(await file.text());if(!Array.isArray(parsed.charts))throw new Error('Formato de espacio inválido');const clean=parsed.charts.map((x:any)=>({...newChart(String(x.symbol||'BTCUSDT'),exchanges[x.exchange as ExchangeId]?x.exchange:'binance'),...x,id:crypto.randomUUID()}));setCharts(clean);if(parsed.name)setWorkspaceName(String(parsed.name));}catch(e){alert(e instanceof Error?e.message:String(e));}};
 return <main className="app-shell">
  <header className="app-header"><div className="brand"><span className="brand-mark">▥</span><b>CHARTFORGE</b><small>PERSONAL TERMINAL</small></div><div className="workspace-name"><input aria-label="Nombre del espacio" value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)}/><span>Guardado local {savedAt&&`· ${savedAt}`}</span></div><div className="header-actions"><button onClick={exportWorkspace}>Exportar</button><label className="import-workspace">Importar<input type="file" accept=".json,application/json" onChange={e=>importWorkspace(e.target.files?.[0])}/></label><button className="primary" onClick={add}>＋ Añadir gráfico</button></div></header>
  <nav className="workspace-toolbar"><div><b>{charts.length}</b> {charts.length===1?'gráfico abierto':'gráficos abiertos'} <span>· Preferencias e indicadores guardados en este navegador</span></div><div className="layout-picker"><span>Distribución</span>{([1,2,4] as const).map(n=><button key={n} className={layout===n?'active':''} onClick={()=>setLayout(n)} title={`${n} columnas`}>{n===1?'▤':n===2?'▥':'▦'}</button>)}<button className="reset-button" onClick={reset}>Restablecer</button></div></nav>
  <section className={`charts-grid layout-${layout}`}>{charts.map(c=><ChartPanel key={c.id} config={c} onChange={p=>patch(c.id,p)} onClose={()=>remove(c.id)} canClose={charts.length>1}/>)}</section>
  {charts.length===0&&<div className="empty-workspace"><div>▥</div><h2>Tu espacio está vacío</h2><p>Añade un gráfico para comenzar a analizar el mercado.</p><button className="primary" onClick={add}>＋ Añadir gráfico</button></div>}
  <footer>ChartForge · Configuración guardada localmente · Datos públicos de mercado · <a href="https://www.tradingview.com" target="_blank" rel="noreferrer">TradingView Lightweight Charts</a></footer>
 </main>;
}

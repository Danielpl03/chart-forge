# ChartForge Personal

Terminal de gráficos personal construido con React, TypeScript, Vite y TradingView Lightweight Charts 5.3.

## Requisitos
- Node.js 20.19+ o 22.12+
- npm

## Arranque
```bash
npm install
npm run dev
```
Abre la URL local que muestra Vite (normalmente http://localhost:5173). En Android, abre `http://localhost:5173` en el navegador del mismo teléfono.

## Exchanges incluidos
- Binance Spot: REST para velas históricas + WebSocket aggTrade público.
- Bybit Spot: REST v5 para velas históricas + WebSocket publicTrade.\n- Bitunix Futures: REST público de klines + WebSocket público `trade`.

No se solicitan claves API: solo se usan endpoints públicos de mercado. Las peticiones REST pasan por el proxy de desarrollo de Vite (`/api/binance`, `/api/bybit`, `/api/bitunix`) para evitar que el navegador tenga que llamar directamente a dominios externos y reducir los errores CORS. El proxy funciona con `npm run dev`; no es un backend de producción. No se envían órdenes.

## CSV
Cabeceras reconocidas (mayúsculas/minúsculas): `time`/`timestamp`/`date`/`datetime`, `open`, `high`, `low`, `close`, opcional `volume`. `time` numérico puede ser Unix en segundos o milisegundos; también admite fechas parseables por JavaScript. El CSV se dibuja en una instancia de gráfico separada, debajo del gráfico LIVE. No se mezcla con el array ni con el WebSocket en vivo.

## Indicadores incluidos
- EMA, SMA, Bollinger sobre el gráfico principal.
- RSI y MACD en panel inferior.
- Volumen en panel inferior.

## Extender
- `src/exchanges.ts`: adaptadores de exchange que implementan `ExchangeAdapter`. Incluye Bitunix Futures, además de Binance y Bybit.
- `src/indicators.ts`: cálculos puros de indicadores.
- `src/Chart.tsx`: representación de series y paneles.
- `src/types.ts`: contratos de datos y `DrawingTool`, reservado para futuras herramientas de dibujo.
- `src/csv.ts`: normalización de datos importados.

### Añadir un exchange
Implementa `fetchCandles` y `subscribeTrades` en `ExchangeAdapter`, normalizando todas las marcas temporales a Unix segundos y trades a precio, timestamp y cantidad. Registra el adaptador en `exchanges`.

### Añadir herramientas de dibujo en el futuro
Lightweight Charts permite extender el canvas con series primitives y pane primitives. El modelo `DrawingTool` ya está reservado; el futuro gestor de herramientas podrá persistir objetos de dibujo por símbolo/temporalidad y renderizarlos como primitives.

## Separación de datos
`live` y `csv` son estados separados y cada uno se renderiza en una instancia de gráfico distinta. Importar/quitar CSV no reinicia el socket, no llama `setData` sobre la serie LIVE y no altera las velas del exchange.

## Nota de licencia
Lightweight Charts se distribuye bajo Apache 2.0 y requiere atribución visible a TradingView y enlace a tradingview.com. La atribución está en el pie de la aplicación. Revisa siempre el texto NOTICE de la versión instalada antes de distribuir.


## Gestión de espacios y múltiples gráficos (v0.2)
- Abre varios gráficos simultáneos con su propio exchange, símbolo, temporalidad, WebSocket e indicadores.
- Distribuciones de 1, 2 o 4 gráficos.
- Cada gráfico permite activar/desactivar y eliminar indicadores de forma independiente.
- El nombre del espacio, la distribución seleccionada, la lista de gráficos y sus indicadores se guardan automáticamente en `localStorage` del navegador.
- Cambia el nombre del espacio y exporta/importa la configuración como JSON.
- Los datos de mercado se vuelven a solicitar al abrir la aplicación; no se persisten ticks ni velas en localStorage.
- Los CSV se mantienen aislados en el gráfico donde se importaron y permanecen en memoria mientras la pestaña está abierta; no se incluyen en la configuración exportada.


## Navegación por secciones, mercados, watchlists, indicadores y alertas (v0.4)

- Navegación separada por pestañas: Gráficos, Mercados, Watchlists, Indicadores y Alertas.
- Explorador de mercados spot de Binance y Bybit, y contratos futures de Bitunix. Permite filtrar pares, consultar precio/variación de 24 h cuando el exchange los publica y abrir un gráfico directamente.
- Watchlists locales: crea listas, añade activos desde Mercados, elimina elementos y abre un símbolo en un gráfico. No hay un campo para escribir un símbolo directamente dentro del gráfico ni para crear alertas con un símbolo arbitrario.
- Gestor de indicadores separado por gráfico: añadir, configurar periodo, activar/desactivar y eliminar EMA, SMA, Bollinger, RSI, MACD y Volumen.
- Alertas de precio por encima/debajo de un nivel. El activo se selecciona desde los mercados presentes en gráficos y watchlists. Se guardan en `localStorage`, se comprueban cada 15 segundos mientras la aplicación está abierta y también con los ticks de los gráficos abiertos.
- Notificaciones del navegador opcionales mediante el permiso del usuario.
- Exportar/importar incluye ahora gráficos, watchlists y alertas.

**Limitaciones:** las alertas no se ejecutan con la aplicación cerrada ni funcionan como servicio push en segundo plano. El proxy Vite requiere mantener `npm run dev` activo en Termux; si ves un error de conexión, reinicia Vite y revisa el mensaje detallado que aparece en la pestaña Mercados. Los WebSocket públicos siguen conectándose directamente a cada exchange y dependen de su disponibilidad de red.

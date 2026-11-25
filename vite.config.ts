import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api/binance': { target: 'https://data-api.binance.vision', changeOrigin: true, rewrite: path => path.replace(/^\/api\/binance/, '') },
      '/api/bybit': { target: 'https://api.bybit.com', changeOrigin: true, rewrite: path => path.replace(/^\/api\/bybit/, '') },
      '/api/bitunix': { target: 'https://fapi.bitunix.com', changeOrigin: true, rewrite: path => path.replace(/^\/api\/bitunix/, '') },
    },
  },
});

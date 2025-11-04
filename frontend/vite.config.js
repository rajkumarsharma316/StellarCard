import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import commonjs from 'vite-plugin-commonjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    commonjs({
      include: ['soroban-client', '@stellar/stellar-sdk/**'],
    }),
  ],
  resolve: {
    alias: {
      '@stellar_card': path.resolve(__dirname, '../packages/stellar_card/src'),
      'tslib': path.resolve(__dirname, 'node_modules/tslib'),
    },
  },
  optimizeDeps: {
    include: ['@stellar/stellar-sdk', '@soroban-react/core', 'tslib'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  build: {
    commonjsOptions: {
      include: [/soroban-client/, /tslib/, /node_modules/, /@stellar\/stellar-sdk/],
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
      strictRequires: false,
    },
  },
})

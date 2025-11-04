import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import './index.css';
import App from './App.jsx';

// Define testnet chain configuration
const testnet = {
  id: 'testnet',
  name: 'Testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org:443',
};

const chains = [testnet];
const connectors = [freighter()];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SorobanReactProvider
      chains={chains}
      connectors={connectors}
      appName="Stellar Card NFT"
      autoconnect
    >
      <App />
    </SorobanReactProvider>
  </StrictMode>,
);

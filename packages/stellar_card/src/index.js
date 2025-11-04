import { Contract, SorobanRpc, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

/**
 * Network configurations
 */
export const networks = {
  testnet: {
    networkPassphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
  },
  futurenet: {
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    rpcUrl: 'https://rpc-futurenet.stellar.org:443',
  },
  standalone: {
    networkPassphrase: 'Standalone Network ; February 2017',
    rpcUrl: 'http://localhost:8000/soroban/rpc',
  },
};

/**
 * Client for interacting with the StellarCard contract
 */
export class Client {
  constructor(options) {
    this.networkPassphrase = options.networkPassphrase;
    this.rpcUrl = options.rpcUrl;
    this.contractId = options.contractId;
    this.wallet = options.wallet || null;
    
    // Initialize RPC server
    this.server = new SorobanRpc.Server(this.rpcUrl, {
      allowHttp: this.rpcUrl.startsWith('http://'),
    });
    
    // Initialize contract
    this.contract = new Contract(this.contractId);
  }

  /**
   * Initialize the contract
   * @param {string} admin - Admin address
   */
  async initialize({ admin }) {
    if (!this.wallet) {
      throw new Error('Wallet connection required');
    }
    
    const sourceAccount = await this.getSourceAccount();
    const op = this.contract.call('initialize', nativeToScVal(admin));
    
    const tx = new SorobanRpc.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    
    // Sign with wallet
    const signed = await this.wallet.signTransaction(prepared.toXDR(), {
      networkPassphrase: this.networkPassphrase,
    });
    
    const sent = await this.server.sendTransaction(SorobanRpc.TransactionBuilder.fromXDR(signed, this.networkPassphrase));
    
    if (sent.status === 'PENDING') {
      await this.server.waitForTransaction(sent.hash);
      const result = await this.server.getTransaction(sent.hash);
      return { result: result.resultXdr };
    }
    
    throw new Error(`Transaction failed: ${sent.errorResult?.code || 'Unknown error'}`);
  }

  /**
   * Admin mint a new card
   * @param {string} to - Recipient address
   * @param {string} uri - Metadata URI
   * @returns {Promise<{result: number}>} Token ID
   */
  async admin_mint({ to, uri }) {
    if (!this.wallet) {
      throw new Error('Wallet connection required');
    }
    
    const sourceAccount = await this.getSourceAccount();
    const op = this.contract.call('admin_mint', 
      nativeToScVal(to),
      nativeToScVal(uri)
    );
    
    const tx = new SorobanRpc.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    
    // Sign with wallet
    const signed = await this.wallet.signTransaction(prepared.toXDR(), {
      networkPassphrase: this.networkPassphrase,
    });
    
    const sent = await this.server.sendTransaction(SorobanRpc.TransactionBuilder.fromXDR(signed, this.networkPassphrase));
    
    if (sent.status === 'PENDING') {
      await this.server.waitForTransaction(sent.hash);
      const result = await this.server.getTransaction(sent.hash);
      const tokenId = scValToNative(result.returnValue);
      return { result: tokenId };
    }
    
    throw new Error(`Transaction failed: ${sent.errorResult?.code || 'Unknown error'}`);
  }

  /**
   * Public mint a new card
   * @param {string} to - Recipient address
   */
  async public_mint({ to }) {
    if (!this.wallet) {
      throw new Error('Wallet connection required');
    }
    
    const sourceAccount = await this.getSourceAccount();
    const op = this.contract.call('public_mint', nativeToScVal(to));
    
    const tx = new SorobanRpc.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    
    // Sign with wallet
    const signed = await this.wallet.signTransaction(prepared.toXDR(), {
      networkPassphrase: this.networkPassphrase,
    });
    
    const sent = await this.server.sendTransaction(SorobanRpc.TransactionBuilder.fromXDR(signed, this.networkPassphrase));
    
    if (sent.status === 'PENDING') {
      await this.server.waitForTransaction(sent.hash);
      const result = await this.server.getTransaction(sent.hash);
      return { result: result.resultXdr };
    }
    
    throw new Error(`Transaction failed: ${sent.errorResult?.code || 'Unknown error'}`);
  }

  /**
   * Transfer a card
   * @param {string} from - Sender address
   * @param {string} to - Recipient address
   * @param {number} token_id - Token ID
   */
  async transfer({ from, to, token_id }) {
    if (!this.wallet) {
      throw new Error('Wallet connection required');
    }
    
    const sourceAccount = await this.getSourceAccount();
    const op = this.contract.call('transfer',
      nativeToScVal(from),
      nativeToScVal(to),
      nativeToScVal(token_id, { type: 'u64' })
    );
    
    const tx = new SorobanRpc.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    
    // Sign with wallet
    const signed = await this.wallet.signTransaction(prepared.toXDR(), {
      networkPassphrase: this.networkPassphrase,
    });
    
    const sent = await this.server.sendTransaction(SorobanRpc.TransactionBuilder.fromXDR(signed, this.networkPassphrase));
    
    if (sent.status === 'PENDING') {
      await this.server.waitForTransaction(sent.hash);
      const result = await this.server.getTransaction(sent.hash);
      return { result: result.resultXdr };
    }
    
    throw new Error(`Transaction failed: ${sent.errorResult?.code || 'Unknown error'}`);
  }

  /**
   * Get owner of a token (read-only)
   * @param {number} token_id - Token ID
   * @returns {Promise<{result: string}>} Owner address
   */
  async owner_of({ token_id }) {
    const op = this.contract.call('owner_of', nativeToScVal(token_id, { type: 'u64' }));
    
    // Use a dummy account for read-only calls
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    
    const tx = new SorobanRpc.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const { result } = await this.server.simulateTransaction(tx);
    
    if (!result || !result.retval) {
      throw new Error('Token does not exist');
    }
    
    return { result: scValToNative(result.retval) };
  }

  /**
   * Get token URI (read-only)
   * @param {number} token_id - Token ID
   * @returns {Promise<{result: string}>} Token URI
   */
  async token_uri({ token_id }) {
    const op = this.contract.call('token_uri', nativeToScVal(token_id, { type: 'u64' }));
    
    // Use a dummy account for read-only calls
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    
    const tx = new SorobanRpc.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const { result } = await this.server.simulateTransaction(tx);
    
    if (!result || !result.retval) {
      throw new Error('Token does not exist');
    }
    
    return { result: scValToNative(result.retval) };
  }

  /**
   * Get total supply (read-only)
   * @returns {Promise<{result: number}>} Total supply
   */
  async total_supply() {
    const op = this.contract.call('total_supply');
    
    // Use a dummy account for read-only calls
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    
    const tx = new SorobanRpc.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const { result } = await this.server.simulateTransaction(tx);
    
    return { result: scValToNative(result?.retval) || 0 };
  }

  /**
   * Get source account for transactions
   * @private
   */
  async getSourceAccount() {
    if (!this.wallet || !this.wallet.address) {
      throw new Error('Wallet connection required. Please connect your wallet first.');
    }
    return await this.server.getAccount(this.wallet.address);
  }
}


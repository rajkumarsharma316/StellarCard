import { useState, useEffect } from "react";
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  getAddress as freighterGetAddress,
  getNetwork as freighterGetNetwork,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import { useSorobanReact } from "@soroban-react/core";
import * as Client from "@stellar_card/index.js";
import "./App.css";

// Contract configuration - Update this with your deployed contract ID
const CONTRACT_ID =
  process.env.VITE_CONTRACT_ID ||
  "CDQ4LCGKICDNAQKRFGPCTDVDNWUU7JIVXGWKGSPA3A5A44Q45PCB7PD4";

function App() {
  const sorobanReact = useSorobanReact();
  const { activeChain, connect, disconnect } = sorobanReact;
  const [walletAddress, setWalletAddress] = useState(null);

  const [contract, setContract] = useState(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Token query states
  const [queryTokenId, setQueryTokenId] = useState("");
  const [tokenOwner, setTokenOwner] = useState("");
  const [tokenUri, setTokenUri] = useState("");

  // Mint states
  const [mintTo, setMintTo] = useState("");
  const [mintUri, setMintUri] = useState("");

  // Transfer states
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferTokenId, setTransferTokenId] = useState("");

  // Initialize contract when wallet is connected
  useEffect(() => {
    if (!walletAddress) {
      setContract(null);
      return;
    }

    if (
      !CONTRACT_ID ||
      CONTRACT_ID === "CDQ4LCGKICDNAQKRFGPCTDVDNWUU7JIVXGWKGSPA3A5A44Q45PCB7PD4"
    ) {
      console.warn(
        "[StellarCard] CONTRACT_ID is not configured. Please set VITE_CONTRACT_ID in your .env"
      );
      setError(
        "Contract ID is missing. Update VITE_CONTRACT_ID in your .env and restart the app."
      );
      setContract(null);
      return;
    }

    const contractClient = new Client.Client({
      ...Client.networks.testnet,
      rpcUrl: "https://soroban-testnet.stellar.org:443",
      contractId: CONTRACT_ID,
      wallet: {
        address: walletAddress,
        signTransaction: async (xdr) => {
          const res = await freighterSignTransaction(xdr, {
            network: "TESTNET",
            networkPassphrase: "Test SDF Network ; September 2015",
            address: walletAddress,
          });
          return res?.signedTxXdr ?? res;
        },
      },
    });

    setError(null);
    setContract(contractClient);
    loadTotalSupply(contractClient);
  }, [activeChain, walletAddress]);

  const loadTotalSupply = async (client = contract) => {
    if (!client) return;
    try {
      setLoading(true);
      const { result } = await client.total_supply();
      setTotalSupply(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Ensure Freighter is available and permissioned before using the connector
      const hasFreighter = await freighterIsConnected();
      if (!hasFreighter) {
        setError(
          "Freighter extension not detected. Please install and try again."
        );
        return;
      }

      const allowed = await freighterIsAllowed();
      if (!allowed) {
        await freighterSetAllowed();
      }

      // This prompts Freighter to expose the public key if not already approved
      const addr = await freighterGetAddress();
      const extracted = typeof addr === "string" ? addr : addr?.address;
      if (!extracted) {
        setError("Unable to retrieve Freighter address.");
        return;
      }
      setWalletAddress(extracted);

      // Check Freighter's selected network
      const networkInfo = await freighterGetNetwork();
      if (
        networkInfo?.networkPassphrase &&
        networkInfo.networkPassphrase !==
          Client.networks.testnet.networkPassphrase
      ) {
        setError(
          `Freighter is set to ${networkInfo.network}. Switch to Testnet in Freighter and retry.`
        );
        return;
      }

      // Now let soroban-react establish the session
      let result;
      try {
        if (sorobanReact?.connectors && sorobanReact.connectors.length > 0) {
          result = await connect({ connector: sorobanReact.connectors[0] });
        } else {
          result = await connect();
        }
      } catch (innerErr) {
        console.error("[StellarCard] connect threw", innerErr);
        throw innerErr;
      }
      if (!result && !sorobanReact.address) {
        console.warn(
          "Freighter connected but SorobanReact returned no address."
        );
      }
    } catch (err) {
      console.error("[StellarCard] handleConnect error", err);
      setError(err.message);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setContract(null);
    setTotalSupply(0);
    setTokenOwner("");
    setTokenUri("");
    setWalletAddress(null);
  };

  const handleQueryToken = async () => {
    if (!contract || !queryTokenId) return;
    try {
      setLoading(true);
      setError(null);
      console.debug("[StellarCard] Query token", { queryTokenId });

      const tokenId = parseInt(queryTokenId);
      const ownerResult = await contract.owner_of({ token_id: tokenId });
      const uriResult = await contract.token_uri({ token_id: tokenId });
      console.debug("[StellarCard] Query results", { ownerResult, uriResult });

      setTokenOwner(ownerResult.result);
      setTokenUri(uriResult.result);
    } catch (err) {
      console.error("[StellarCard] handleQueryToken error", err);
      setError(err.message);
      setTokenOwner("");
      setTokenUri("");
    } finally {
      setLoading(false);
    }
  };

  const handlePublicMint = async () => {
    if (!contract || !walletAddress) {
      setError("Please connect your wallet first");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.debug("[StellarCard] Public mint requested", {
        to: walletAddress,
      });

      await contract.public_mint({ to: walletAddress });
      await loadTotalSupply();
      alert("Card minted successfully!");
    } catch (err) {
      console.error("[StellarCard] handlePublicMint error", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminMint = async () => {
    if (!contract || !mintTo || !mintUri) {
      setError("Please fill in both recipient address and URI");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.debug("[StellarCard] Admin mint requested", {
        to: mintTo,
        uri: mintUri,
      });

      const { result } = await contract.admin_mint({
        to: mintTo,
        uri: mintUri,
      });
      console.debug("[StellarCard] Admin mint result", { result });
      await loadTotalSupply();
      alert(`Card minted successfully! Token ID: ${result}`);
      setMintTo("");
      setMintUri("");
    } catch (err) {
      console.error("[StellarCard] handleAdminMint error", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!contract || !transferFrom || !transferTo || !transferTokenId) {
      setError("Please fill in all transfer fields");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.debug("[StellarCard] Transfer requested", {
        from: transferFrom,
        to: transferTo,
        tokenId: transferTokenId,
      });

      const tokenId = parseInt(transferTokenId);
      await contract.transfer({
        from: transferFrom,
        to: transferTo,
        token_id: tokenId,
      });
      console.debug("[StellarCard] Transfer completed");

      alert("Card transferred successfully!");
      setTransferFrom("");
      setTransferTo("");
      setTransferTokenId("");

      // Update owner if we queried this token
      if (parseInt(queryTokenId) === tokenId) {
        await handleQueryToken();
      }
    } catch (err) {
      console.error("[StellarCard] handleTransfer error", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎴 Stellar Card NFT</h1>
        <div className="wallet-section">
          {walletAddress ? (
            <div className="wallet-info">
              <p>
                Connected: {walletAddress.slice(0, 8)}...
                {walletAddress.slice(-8)}
              </p>
              <button onClick={handleDisconnect} className="btn btn-secondary">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={handleConnect} className="btn btn-primary">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Contract Stats */}
        <section className="section">
          <h2>Contract Stats</h2>
          <div className="stats">
            <div className="stat-card">
              <label>Total Supply</label>
              <div className="stat-value">{totalSupply}</div>
              <button
                onClick={() => loadTotalSupply()}
                disabled={loading || !contract}
                className="btn btn-small"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Query Token */}
        <section className="section">
          <h2>Query Token</h2>
          <div className="form-group">
            <label>Token ID:</label>
            <input
              type="number"
              value={queryTokenId}
              onChange={(e) => setQueryTokenId(e.target.value)}
              placeholder="Enter token ID"
            />
            <button
              onClick={handleQueryToken}
              disabled={loading || !contract}
              className="btn btn-primary"
            >
              Query
            </button>
          </div>
          {(tokenOwner || tokenUri) && (
            <div className="token-info">
              <div>
                <strong>Owner:</strong> {tokenOwner}
              </div>
              <div style={{ marginTop: "0.25rem" }}>
                <strong>URI:</strong> {tokenUri}
              </div>
              {tokenUri?.startsWith("ipfs://") && (
                <div style={{ marginTop: "0.5rem" }}>
                  <a
                    href={`https://ipfs.io/ipfs/${tokenUri.replace(
                      "ipfs://",
                      ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open on IPFS gateway ↗
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Public Mint */}
        <section className="section">
          <h2>Mint New Card</h2>
          <div className="form-group">
            <button
              onClick={handlePublicMint}
              disabled={loading || !contract || !walletAddress}
              className="btn btn-primary"
            >
              {loading ? "Minting..." : "Mint Card (Public)"}
            </button>
            <p className="form-help">
              Mints a random card to your connected wallet
            </p>
          </div>
        </section>

        {/* Admin Mint */}
        <section className="section">
          <h2>Admin Mint</h2>
          <div className="form-group">
            <label>Recipient Address:</label>
            <input
              type="text"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
              placeholder="G..."
            />
          </div>
          <div className="form-group">
            <label>Metadata URI:</label>
            <input
              type="text"
              value={mintUri}
              onChange={(e) => setMintUri(e.target.value)}
              placeholder="ipfs://..."
            />
          </div>
          <button
            onClick={handleAdminMint}
            disabled={loading || !contract}
            className="btn btn-primary"
          >
            {loading ? "Minting..." : "Mint (Admin)"}
          </button>
        </section>

        {/* Transfer */}
        <section className="section">
          <h2>Transfer Card</h2>
          <div className="form-group">
            <label>From Address:</label>
            <input
              type="text"
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value)}
              placeholder="G..."
            />
          </div>
          <div className="form-group">
            <label>To Address:</label>
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="G..."
            />
          </div>
          <div className="form-group">
            <label>Token ID:</label>
            <input
              type="number"
              value={transferTokenId}
              onChange={(e) => setTransferTokenId(e.target.value)}
              placeholder="0"
            />
          </div>
          <button
            onClick={handleTransfer}
            disabled={loading || !contract}
            className="btn btn-primary"
          >
            {loading ? "Transferring..." : "Transfer"}
          </button>
        </section>
      </main>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default App;

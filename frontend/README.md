# Stellar Card NFT Frontend

React frontend for interacting with the Stellar Card NFT contract on Stellar/Soroban.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your contract ID:**
   - Copy `.env.example` to `.env`
   - Replace `YOUR_CONTRACT_ID_HERE` with your deployed contract ID

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Features

- Connect wallet using Freighter
- View contract stats (total supply)
- Query token information (owner, URI)
- Mint new cards (public mint)
- Admin mint cards
- Transfer cards between addresses

## Contract Functions

- `total_supply()` - Get total number of cards minted
- `owner_of(token_id)` - Get owner of a specific card
- `token_uri(token_id)` - Get metadata URI for a card
- `public_mint(to)` - Mint a random card to your wallet
- `admin_mint(to, uri)` - Admin mint a card with specific URI
- `transfer(from, to, token_id)` - Transfer a card

## Requirements

- Node.js 18+
- Freighter wallet extension installed in your browser

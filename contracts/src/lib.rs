#![no_std]

// Import everything we need from the Soroban SDK
use soroban_sdk::{
    contract, contractimpl, 
    Address, Env, String, // Basic types
};

// Import our custom DataKey enum from the other file
mod nft_card;
use nft_card::DataKey;

#[contract]
pub struct StellarCardContract;

#[contractimpl]
impl StellarCardContract {

    // --- 1. Initialize the Contract ---
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("contract has already been initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalSupply, &0u64);
    }

    // --- 2. Admin Mint Function ---
    // (This is your original function for minting sample cards)
    pub fn admin_mint(env: Env, to: Address, uri: String) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let token_id: u64 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        
        if env.storage().instance().has(&DataKey::Owner(token_id)) {
            panic!("token ID already exists");
        }

        env.storage().instance().set(&DataKey::Owner(token_id), &to);
        env.storage().instance().set(&DataKey::URI(token_id), &uri);
        env.storage().instance().set(&DataKey::TotalSupply, &(token_id + 1));
        
        token_id
    }

    // --- 3. Transfer Function ---
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u64) {
        from.require_auth();
        let owner = Self::owner_of(env.clone(), token_id);
        if owner != from {
            panic!("'from' address is not the owner");
        }
        env.storage().instance().set(&DataKey::Owner(token_id), &to);
    }

    // --- 4. Read-Only: Get Owner ---
    pub fn owner_of(env: Env, token_id: u64) -> Address {
        env.storage().instance().get(&DataKey::Owner(token_id))
            .unwrap_or_else(|| panic!("token does not exist"))
    }

    // --- 5. Read-Only: Get Metadata URI ---
    pub fn token_uri(env: Env, token_id: u64) -> String {
        env.storage().instance().get(&DataKey::URI(token_id))
            .unwrap_or_else(|| panic!("token does not exist"))
    }

    // --- 6. Read-Only: Get Total Supply ---
    pub fn total_supply(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }

    // --- 7. NEW Public Mint Function ---
    // This lets anyone mint a new card.
    pub fn public_mint(env: Env, to: Address) {
        // Verify that the 'to' address is the one signing this transaction
        to.require_auth();

        // Get the current total supply to use as the new Token ID
        let token_id: u64 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        
        if env.storage().instance().has(&DataKey::Owner(token_id)) {
            panic!("token ID already exists");
        }

        // --- Super Simple "Randomness" ---
        // We pick one of our 3 sample cards based on the token ID.
        // A real game would use a more complex, secure method.
        
        // We hard-code the IPFS URIs from your mint script.
        let dragon_uri = String::from_slice(&env, "ipfs://QmUYrFddXf4SpEXWAp6RpSm6XZmwxiDRKLNixt58nuhwAo");
        let mage_uri = String::from_slice(&env, "ipfs://QmbZEqRXpz35zfXkyhAoPAfZLZLZmr1rDSXKbtuS5UhNPm");
        let warrior_uri = String::from_slice(&env, "ipfs://QmdwASjP4qiyhvn6vJrDr2P3sudJ45KLtiariQmdqQAG9g");

        let new_uri;
        let remainder = token_id % 3; // Get a number: 0, 1, or 2

        if remainder == 0 {
            new_uri = dragon_uri;
        } else if remainder == 1 {
            new_uri = mage_uri;
        } else {
            new_uri = warrior_uri;
        }
        // --- End of Simple "Randomness" ---

        // --- Core minting logic ---
        env.storage().instance().set(&DataKey::Owner(token_id), &to);
        env.storage().instance().set(&DataKey::URI(token_id), &new_uri);

        // Increment the total supply for the *next* mint
        env.storage().instance().set(&DataKey::TotalSupply, &(token_id + 1));
    }
}
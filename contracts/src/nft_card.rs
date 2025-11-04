use soroban_sdk::{contracttype};

// --- Define the keys for our database (storage) ---
#[contracttype]
#[derive(Clone, Copy)]
pub enum DataKey {
    Admin,       // Stores the administrator's address
    TotalSupply, // Stores the total number of NFTs minted (u64)
    Owner(u64),  // Stores the owner (Address) for a given Token ID (u64)
    URI(u64),    // Stores the metadata URI (String) for a given Token ID (u64)
}
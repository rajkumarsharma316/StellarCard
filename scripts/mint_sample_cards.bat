@echo off
setlocal

REM --- 1. CONFIGURATION ---
set "CONTRACT_ID=CDQ4LCGKICDNAQKRFGPCTDVDNWUU7JIVXGWKGSPA3A5A44Q45PCB7PD4"
set "WALLET_SECRET=my_wallet"
set "ADMIN_ADDRESS=GAFB4VTKSW2X2L7F3ZOA7O2E4BKTQZ5H4VGLSRPXQZKWHQ2D7BCF3UFH"
set "IPFS_DRAGON_URI=ipfs://QmUYrFddXf4SpEXWAp6RpSm6XZmwxiDRKLNixt58nuhwAo"
set "IPFS_MAGE_URI=ipfs://QmbZEqRXpz35zfXkyhAoPAfZLZLZmr1rDSXKbtuS5UhNPm"
set "IPFS_WARRIOR_URI=ipfs://QmdwASjP4qiyhvn6vJrDr2P3sudJ45KLtiariQmdqQAG9g"


REM --- 2. MINT CARDS ---

echo Minting Fire Dragon...
stellar contract invoke ^
    --id "%CONTRACT_ID%" ^
    --source "%WALLET_SECRET%" ^
    --network testnet ^
    -- ^
    admin_mint ^
    --to "%ADMIN_ADDRESS%" ^
    --uri "%IPFS_DRAGON_URI%"

IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Minting Fire Dragon failed.
    goto :eof
)

echo Minting Ice Mage...
stellar contract invoke ^
    --id "%CONTRACT_ID%" ^
    --source "%WALLET_SECRET%" ^
    --network testnet ^
    -- ^
    admin_mint ^
    --to "%ADMIN_ADDRESS%" ^
    --uri "%IPFS_MAGE_URI%"

IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Minting Ice Mage failed.
    goto :eof
)

echo Minting Stone Warrior...
stellar contract invoke ^
    --id "%CONTRACT_ID%" ^
    --source "%WALLET_SECRET%" ^
    --network testnet ^
    -- ^
    admin_mint ^
    --to "%ADMIN_ADDRESS%" ^
    --uri "%IPFS_WARRIOR_URI%"

IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Minting Stone Warrior failed.
    goto :eof
)

echo ---
echo All 3 sample cards minted to %ADMIN_ADDRESS%!
echo You can now check your wallet in the frontend app.

endlocal
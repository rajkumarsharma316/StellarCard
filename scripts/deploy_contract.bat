@echo off
setlocal

REM --- 1. CONFIGURATION ---
REM This is the public key (G... address) you got from 'stellar keys public-key my_wallet'
set "ADMIN_ADDRESS=GAFB4VTKSW2X2L7F3ZOA7O2E4BKTQZ5H4VGLSRPXQZKWHQ2D7BCF3UFH"

REM This is the alias for your wallet from 'stellar keys add my_wallet'
set "WALLET_SECRET=my_wallet"


REM --- 2. BUILD THE CONTRACT ---
echo Building the contract...
cd contracts
stellar contract build
cd ..

REM Use Windows-style backslashes for the path
REM
REM --- ⚠️ THIS IS THE FIXED LINE ---
set "WASM_FILE=.\contracts\target\wasm32v1-none\release\stellar_card_contract.wasm"
REM --------------------------------
REM

IF NOT EXIST "%WASM_FILE%" (
    echo Error: Contract WASM file not found. Build failed.
    echo Looked for: %WASM_FILE%
    goto :eof
)


REM --- 3. DEPLOY THE CONTRACT ---
echo Deploying the contract to Testnet...
REM We use a FOR loop to capture the output of the deploy command into the CONTRACT_ID variable
FOR /F "tokens=*" %%i IN (
    'stellar contract deploy --wasm "%WASM_FILE%" --source "%WALLET_SECRET%" --network testnet'
) DO (
    set "CONTRACT_ID=%%i"
)

REM Check if the variable is empty
if "%CONTRACT_ID%"=="" (
    echo Error: Contract deployment failed. The CONTRACT_ID was not captured.
    goto :eof
)

echo Contract deployed successfully!
echo CONTRACT_ID: %CONTRACT_ID%


REM --- 4. INITIALIZE THE CONTRACT ---
echo Initializing the contract...
REM The ^ character lets us break the command into multiple lines
stellar contract invoke ^
    --id "%CONTRACT_ID%" ^
    --source "%WALLET_SECRET%" ^
    --network testnet ^
    -- ^
    initialize ^
    --admin "%ADMIN_ADDRESS%"

echo Contract initialized with admin: %ADMIN_ADDRESS%
echo ---
echo DEPLOYMENT COMPLETE
echo Save this CONTRACT_ID for your frontend: %CONTRACT_ID%

endlocal
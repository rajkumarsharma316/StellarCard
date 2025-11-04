@echo off
setlocal

echo Running tests for the contract...

REM Change to the contracts directory
cd contracts

REM Check if 'cd contracts' was successful
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: 'contracts' directory not found.
    goto :eof
)

REM Run the tests
cargo test

REM Check if 'cargo test' failed
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cargo tests failed.
    goto :eof
)

REM Go back to the parent directory
cd ..

echo Tests passed!

endlocal
# Chipi Offramp System Architecture

## Main Modules

### 1. Stellar Account (`src/lib/stellar/account.ts`)
**Responsibility**: Create and manage Stellar accounts
- Create new Stellar accounts
- Fund accounts with minimum XLM
- Set USDC trustlines
- Encrypt private keys

**Key Functions**:
- `createStellarAccountWithTrustline()`: Creates a new account and sets a USDC trustline

### 2. Stellar Payments (`src/lib/stellar/payments.ts`)
**Responsibility**: Send USDC payments on the Stellar network
- Send USDC to destination accounts
- Handle transaction memos
- Manage network fees

**Key Functions**:
- `sendUSDCToDestination()`: Sends USDC with a memo

### 3. MoneyGram Auth (`src/lib/moneygram/auth.ts`)
**Responsibility**: SEP-10 authentication with MoneyGram
- Authenticate using the official library
- Manage authentication tokens
- Configure testnet/production environment

**Key Functions**:
- `authenticateWithMoneyGram()`: Perform SEP-10 authentication

### 4. MoneyGram Transactions (`src/lib/moneygram/transactions.ts`)

**Responsibility**: SEP-24 withdrawals with MoneyGram
- Initiate withdrawal transactions
- Monitor transaction statuses
- Handle status callbacks

**Key Functions**:
- `initiateMoneyGramWithdrawal()`: Initiates withdrawal
- `monitorMoneyGramTransaction()`: Monitors transaction status


## API Endpoints

### 1. `/api/stellar/create-account` (POST)
**Purpose**: Create a Stellar account with a USDC trustline
```json
{
  "pin": "1234"
}
```

### 2. `/api/moneygram/withdraw` (POST)
**Purpose**: Initiate a MoneyGram withdrawal (no account creation)
```json
{
  "amount": "100",
  "userId": "user123"
}
```

### 3. `/api/moneygram/status` (GET)
**Purpose**: Check transaction status
```
/api/moneygram/status?transactionId=abc123
```


### 4. `/api/moneygram` (POST)
**Purpose**: Full flow (account creation + withdrawal)

```json
{
  "amount": "100",
  "userId": "user123"
}
```

```json
{
  "pin": "1234",
  "amount": "100",
  "userId": "user123"
}
```


## Configuration

### Required Environment Variables
```env
# Stellar
STELLAR_FUNDER_SECRET_KEY=your_funder_secret_key

# MoneyGram
MONEYGRAM_AUTH_SECRET_KEY=your_auth_secret_key
MONEYGRAM_FUNDS_SECRET_KEY=your_funds_secret_key
```

### Centralized Configuration (`src/lib/config.ts`)
- Stellar settings (URLs, USDC config, etc.)
- MoneyGram settings (testnet/production)
- App-wide configuration


## Full Transaction Flow

1. **Create Stellar Account**
   - Generate keypair
   - Fund with minimum XLM
   - Create USDC trustline
   - Encrypt private key

2. **Authenticate with MoneyGram**
   - SEP-10 authentication
   - Get access token

3. **Initiate Withdrawal**
   - Create SEP-24 transaction
   - Get transaction ID and interactive URL

4. **Monitor Status**
   - Wait for `pending_user_transfer_start` status
   - Retrieve destination account and memo

5. **Send USDC**
   - Send USDC to MoneyGram account
   - Include required memo


## Architecture Benefits

### ✅ Modularity
- Each module has a single responsibility
- Easy to test individually
- Reusable across contexts

### ✅ Maintainability
- Clean and well-documented codebase
- Clear separation of concerns
- Easier to debug

### ✅ Scalability
- Dedicated endpoints for each feature
- Centralized configuration
- New features are easy to integrate


### ✅ Flexibility
- Use individual endpoints or the full flow
- Easily switch between testnet and production
- Dynamic setup options

## Next Steps


1. **Testing**: Add unit tests for each module
2. **WebSockets**: Implement real-time monitoring
3. **Logging**: Add structured logging
4. **Metrics**: Include performance metrics
5. **Documentation**: Document API with OpenAPI/Swagger


import { Keypair as StellarKeypair, Networks, TransactionBuilder, Operation, BASE_FEE, Asset, Horizon } from "@stellar/stellar-sdk";
import * as CryptoJS from "crypto-js";

export interface StellarWalletData {
    publicKey: string;
    encryptedPrivateKey: string;
}

export interface CreateAccountResult {
    success: boolean;
    stellar?: StellarWalletData;
    transactionHash?: string;
    error?: string;
}

// Stellar configuration
const STELLAR_SERVER_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const MINIMUM_BALANCE = '2'; // Starting balance in XLM

// USDC configuration
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'; // Testnet
const USDC_ASSET_CODE = 'USDC';
const USDC_ASSET = new Asset(USDC_ASSET_CODE, USDC_ISSUER);

/**
 * Creates a new Stellar account, funds it and sets the trustline for USDC in a single transaction
 */
export const createStellarAccountWithTrustline = async (pin: string, funderSecretKey: string): Promise<CreateAccountResult> => {
    try {
        // 1. Create keypair for the new account
        const newAccountKeypair = StellarKeypair.random();
        const newAccountPublicKey = newAccountKeypair.publicKey();
        const newAccountSecret = newAccountKeypair.secret();
        
        console.log("Stellar Public Key for new account:", newAccountPublicKey);

        // 2. Encrypt private key
        const encryptedStellarPrivateKey = CryptoJS.AES.encrypt(newAccountSecret, pin).toString();

        // 3. Get the funder account from secret key
        const server = new Horizon.Server(STELLAR_SERVER_URL);
        const funderKeypair = StellarKeypair.fromSecret(funderSecretKey);
        const funderAccount = await server.loadAccount(funderKeypair.publicKey());

        // 4. Build the transaction with two operations
        const transaction = new TransactionBuilder(funderAccount, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            // First operation: create the account
            .addOperation(Operation.createAccount({
                destination: newAccountPublicKey,
                startingBalance: MINIMUM_BALANCE, // This is in XLM
            }))
            // Second operation: create the trustline for USDC
            // This operation must be sourced by the new account
            .addOperation(Operation.changeTrust({
                asset: USDC_ASSET,
                source: newAccountPublicKey, // The new account is the source
            }))
            .setTimeout(30)
            .build();

        // 5. Sign the transaction with both keypairs
        transaction.sign(funderKeypair); // Funder signs for the creation
        transaction.sign(newAccountKeypair); // New account signs for the trustline

        // 6. Submit the transaction
        const result = await server.submitTransaction(transaction);
        console.log('Account created and trustline set:', result.hash);

        const stellarWallet: StellarWalletData = {
            publicKey: newAccountPublicKey,
            encryptedPrivateKey: encryptedStellarPrivateKey,
        };

        return {
            success: true,
            stellar: stellarWallet,
            transactionHash: result.hash
        };

    } catch (error) {
        console.error('Error creating Stellar account with trustline:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

/**
 * Creates the trustline for USDC in an existing account
 */
/* const createUSDCTrustline = async (server: Horizon.Server, keypair: StellarKeypair): Promise<void> => {
    try {
        const account = await server.loadAccount(keypair.publicKey());
        const usdcAsset = new Asset(USDC_ASSET_CODE, USDC_ISSUER);
        
        const trustlineTransaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(Operation.changeTrust({
                asset: usdcAsset,
                limit: '1000000', // Trust limit
            }))
            .setTimeout(30)
            .build();

        trustlineTransaction.sign(keypair);
        const trustLineResult = await server.submitTransaction(trustlineTransaction);
        console.log('Trustline USDC creado:', trustLineResult.hash);
    } catch (error) {
        console.error('Error creando trustline USDC:', error);
        throw error;
    }
}; */

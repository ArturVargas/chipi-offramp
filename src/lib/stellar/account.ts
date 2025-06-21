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
const MINIMUM_BALANCE = '2';

// USDC configuration
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'; // Testnet
const USDC_ASSET = 'USDC';

/**
 * Creates a new Stellar account, funds it and sets the trustline for USDC
 */
export const createStellarAccountWithTrustline = async (pin: string, funderSecretKey: string): Promise<CreateAccountResult> => {
    try {
        // 1. Create keypair for the new account
        const stellarKeypair = StellarKeypair.random();
        const stellarPublicKey = stellarKeypair.publicKey();
        const stellarSecret = stellarKeypair.secret();
        
        console.log("Creating Stellar account:", stellarPublicKey);

        // 2. Encrypt private key
        const encryptedStellarPrivateKey = CryptoJS.AES.encrypt(stellarSecret, pin).toString();

        // 3. Create and fund the account
        const server = new Horizon.Server(STELLAR_SERVER_URL);
        const funderKeypair = StellarKeypair.fromSecret(funderSecretKey);
        
        const funderAccount = await server.loadAccount(funderKeypair.publicKey());

        const createAccountTransaction = new TransactionBuilder(funderAccount, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(Operation.createAccount({
                destination: stellarPublicKey,
                startingBalance: MINIMUM_BALANCE,
            }))
            .setTimeout(30)
            .build();

        createAccountTransaction.sign(funderKeypair);
        const createResult = await server.submitTransaction(createAccountTransaction);
        console.log('Account created and funded:', createResult.hash);

        // 4. Create trustline for USDC
        await createUSDCTrustline(server, stellarKeypair);

        const stellarWallet: StellarWalletData = {
            publicKey: stellarPublicKey,
            encryptedPrivateKey: encryptedStellarPrivateKey,
        };

        return {
            success: true,
            stellar: stellarWallet,
            transactionHash: createResult.hash
        };

    } catch (error) {
        console.error('Error creando cuenta Stellar:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
};

/**
 * Creates the trustline for USDC in an existing account
 */
const createUSDCTrustline = async (server: Horizon.Server, keypair: StellarKeypair): Promise<void> => {
    try {
        const account = await server.loadAccount(keypair.publicKey());
        const usdcAsset = new Asset(USDC_ASSET, USDC_ISSUER);
        
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
}; 
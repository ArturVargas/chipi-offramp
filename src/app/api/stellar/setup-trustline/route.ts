import { NextResponse } from "next/server";
import { Keypair, Networks, TransactionBuilder, Operation, BASE_FEE, Asset, Horizon } from "@stellar/stellar-sdk";

// Configuration
const STELLAR_SERVER_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC_ASSET = new Asset('USDC', USDC_ISSUER);

// Account private key
const ACCOUNT_SECRET_KEY = process.env.STELLAR_ACCOUNT_SECRET_KEY || '';

export async function POST() {
    try {
        const server = new Horizon.Server(STELLAR_SERVER_URL);
        const accountKeypair = Keypair.fromSecret(ACCOUNT_SECRET_KEY);
        const accountPublicKey = accountKeypair.publicKey();
        
        console.log('Setting up USDC trustline for account:', accountPublicKey);
        
        // Load the account
        const account = await server.loadAccount(accountPublicKey);
        
        // Check if trustline already exists
        const hasTrustline = account.balances.some(balance => 
            balance.asset_type !== 'native' && 
            'asset_code' in balance && 
            balance.asset_code === 'USDC' && 
            'asset_issuer' in balance &&
            balance.asset_issuer === USDC_ISSUER
        );
        
        if (hasTrustline) {
            return NextResponse.json({
                success: true,
                message: 'USDC trustline already exists',
                account: accountPublicKey
            });
        }
        
        // Create trustline transaction
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(Operation.changeTrust({
                asset: USDC_ASSET,
                limit: '1000000', // Trust limit
            }))
            .setTimeout(30)
            .build();

        transaction.sign(accountKeypair);
        const result = await server.submitTransaction(transaction);
        
        console.log('USDC trustline created successfully:', result.hash);
        
        return NextResponse.json({
            success: true,
            message: 'USDC trustline created successfully',
            transactionHash: result.hash,
            account: accountPublicKey
        });

    } catch (error) {
        console.error('Error setting up USDC trustline:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        }, { status: 500 });
    }
} 
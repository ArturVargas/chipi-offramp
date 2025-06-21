import { NextRequest, NextResponse } from "next/server";
import { Keypair as StellarKeypair, Networks, TransactionBuilder, Operation, BASE_FEE, Asset, Horizon } from "@stellar/stellar-sdk";
import * as CryptoJS from "crypto-js";

interface Wallet {
    publicKey: string
    encryptedPrivateKey: string
}

const STELLAR_SERVER_URL = 'https://horizon-testnet.stellar.org'; 
const NETWORK_PASSPHRASE = Networks.TESTNET; 
const MINIMUM_BALANCE = '2'; 

const FUNDER_SECRET_KEY = process.env.STELLAR_FUNDER_SECRET_KEY || '';

const createStellarAccount = async (pin: string) => {
    try {

        const stellarKeypair = StellarKeypair.random();
        const stellarPublicKey = stellarKeypair.publicKey();
        const stellarSecret = stellarKeypair.secret();
        
        console.log("stellarPublicKey", stellarPublicKey);
        console.log("stellarSecret", stellarSecret);

        const encryptedStellarPrivateKey = CryptoJS.AES.encrypt(stellarSecret, pin).toString();
        
        if (!FUNDER_SECRET_KEY) {
            throw new Error('FUNDER_SECRET_KEY no está configurada');
        }

        const server = new Horizon.Server(STELLAR_SERVER_URL);
        const funderKeypair = StellarKeypair.fromSecret(FUNDER_SECRET_KEY);
        
        const funderAccount = await server.loadAccount(funderKeypair.publicKey());

        const transaction = new TransactionBuilder(funderAccount, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(Operation.createAccount({
                destination: stellarPublicKey,
                startingBalance: MINIMUM_BALANCE,
            }))
            .setTimeout(30)
            .build();

        transaction.sign(funderKeypair);
        const result = await server.submitTransaction(transaction);
        console.log('Cuenta creada y fondeada:', result.hash);

        // Crear trustline para USDC (descomenta si necesitas USDC)
        // await createUSDCTrustline(server, stellarKeypair);

        const stellarWallet: Wallet = {
            publicKey: stellarPublicKey,
            encryptedPrivateKey: encryptedStellarPrivateKey,
        };

        return {
            success: true,
            stellar: stellarWallet,
            transactionHash: result.hash
        };

    } catch (error) {
        console.error('Error creando cuenta Stellar:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// Función opcional para crear trustline de USDC
// Para usar esta función, descomenta la línea en createStellarAccount
const createUSDCTrustline = async (server: Horizon.Server, keypair: StellarKeypair) => {
    try {
        // USDC en testnet (cambiar para mainnet)
        const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
        const USDC_ASSET = 'USDC';

        const account = await server.loadAccount(keypair.publicKey());
        const usdcAsset = new Asset(USDC_ASSET, USDC_ISSUER);
        
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(Operation.changeTrust({
                asset: usdcAsset,
                limit: '1000000', // Límite de confianza
            }))
            .setTimeout(30)
            .build();

        transaction.sign(keypair);
        await server.submitTransaction(transaction);
        console.log('Trustline USDC creado');
    } catch (error) {
        console.error('Error creando trustline USDC:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { pin } = await request.json();
        
        if (!pin) {
            return NextResponse.json({ 
                success: false, 
                error: 'PIN es requerido' 
            }, { status: 400 });
        }

        const result = await createStellarAccount(pin);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ 
            success: false, 
            error: 'Error interno del servidor' 
        }, { status: 500 });
    }
}

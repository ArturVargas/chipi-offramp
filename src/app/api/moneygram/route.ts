import { NextRequest, NextResponse } from "next/server";
import { Keypair as StellarKeypair, Networks, TransactionBuilder, Operation, BASE_FEE, Asset, Horizon, Memo } from "@stellar/stellar-sdk";
import { Wallet as StellarWallet, SigningKeypair } from "@stellar/typescript-wallet-sdk";
import * as CryptoJS from "crypto-js";

interface StellarWalletData {
    publicKey: string
    encryptedPrivateKey: string
}

// Configuración de Stellar
const STELLAR_SERVER_URL = 'https://horizon-testnet.stellar.org'; 
const NETWORK_PASSPHRASE = Networks.TESTNET; 
const MINIMUM_BALANCE = '2'; 

// Configuración de MoneyGram
const MGI_ACCESS_HOST = "extmgxanchor.moneygram.com"; // Testnet
// const MGI_ACCESS_HOST = "stellar.moneygram.com"; // Production

// Claves de autenticación (DEBE estar en variables de entorno)
const AUTH_SECRET_KEY = process.env.MONEYGRAM_AUTH_SECRET_KEY || '';
const FUNDER_SECRET_KEY = process.env.STELLAR_FUNDER_SECRET_KEY || '';

// Configuración de USDC
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'; // Testnet
const USDC_ASSET = 'USDC';

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

        // Crear trustline para USDC
        await createUSDCTrustline(server, stellarKeypair);

        const stellarWallet: StellarWalletData = {
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

// Función para crear trustline de USDC
const createUSDCTrustline = async (server: Horizon.Server, keypair: StellarKeypair) => {
    try {
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
        const trustLineResult = await server.submitTransaction(transaction);
        console.log('Trustline USDC creado', trustLineResult.hash);
    } catch (error) {
        console.error('Error creando trustline USDC:', error);
    }
}

// Autenticación SEP-10 con MoneyGram usando la librería
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authenticateWithMoneyGram = async (): Promise<any> => {
    try {
        if (!AUTH_SECRET_KEY) {
            throw new Error('AUTH_SECRET_KEY no está configurada');
        }

        console.log('Iniciando autenticación SEP-10 con MoneyGram...');
        
        // Crear wallet y anchor
        const wallet = StellarWallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        // Crear objeto sep10 para manejar la autenticación
        const sep10 = await anchor.sep10();
        
        // Crear keypair de autenticación
        const authKey = SigningKeypair.fromSecret(AUTH_SECRET_KEY);
        console.log('Auth Public Key:', authKey.publicKey);
        
        // Autenticar usando el método de la librería
        const authToken = await sep10.authenticate({ accountKp: authKey });
        
        console.log('Autenticación SEP-10 exitosa');
        return authToken;
    } catch (error) {
        console.error('Error en autenticación MoneyGram:', error);
        throw error;
    }
}

// Iniciar transacción de retiro con MoneyGram
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initiateMoneyGramWithdrawal = async (authToken: any, amount: string, userId: string) => {
    try {
        const wallet = StellarWallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        // Verificar que MoneyGram soporte USDC
        const info = await anchor.getInfo();
        console.log('info', info.currencies);

        const currency = info.currencies.find(({ code }) => code === USDC_ASSET);
        if (!currency?.code || !currency?.issuer) {
            throw new Error(`MoneyGram no soporta ${USDC_ASSET} o no está configurado correctamente`);
        }

        // Crear keypair para la cuenta de fondos
        const fundsKeypair = SigningKeypair.fromSecret(FUNDER_SECRET_KEY);
        
        // Iniciar transacción de retiro
        const { url, id } = await anchor.sep24().withdraw({
            authToken: authToken,
            withdrawalAccount: fundsKeypair.publicKey,
            assetCode: USDC_ASSET,
            lang: "es", // Español
            extraFields: {
                amount: amount,
                // Campos adicionales específicos de MoneyGram
                country: "MX", // México
                state: "JAL", // Jalisco
                user_id: userId
            },
        });

        console.log('Transacción de retiro iniciada:', { id, url });
        return { id, url };
    } catch (error) {
        console.error('Error iniciando retiro MoneyGram:', error);
        throw error;
    }
}

// Monitorear transacción de MoneyGram
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const monitorMoneyGramTransaction = async (authToken: any, transactionId: string) => {
    try {
        const wallet = StellarWallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        // Crear watcher para monitorear la transacción
        const watcher = anchor.sep24().watcher();
        
        return new Promise<{
            status: string;
            destination?: string;
            memo?: string;
            amount?: string;
            transaction: unknown;
        }>((resolve, reject) => {
            const { stop } = watcher.watchOneTransaction({
                authToken,
                assetCode: USDC_ASSET,
                id: transactionId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMessage: (transaction: any) => {
                    console.log(`Estado de transacción: ${transaction.status}`);
                    
                    if (transaction.status === "pending_user_transfer_start") {
                        // MoneyGram está listo para recibir fondos
                        resolve({
                            status: transaction.status,
                            destination: transaction.withdraw_anchor_account,
                            memo: transaction.withdraw_memo,
                            amount: transaction.amount_in,
                            transaction: transaction
                        });
                        stop();
                    }
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onSuccess: (transaction: any) => {
                    console.log('Transacción completada:', transaction.status);
                    resolve({
                        status: transaction.status,
                        transaction: transaction
                    });
                    stop();
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    console.error('Error en transacción:', error);
                    reject(new Error(`Error en transacción: ${error.message || error}`));
                    stop();
                },
            });
        });
    } catch (error) {
        console.error('Error monitoreando transacción:', error);
        throw error;
    }
}

// Enviar USDC a MoneyGram usando Stellar SDK directamente
const sendUSDCToMoneyGram = async (destination: string, amount: string, memo: string) => {
    try {
        if (!FUNDER_SECRET_KEY) {
            throw new Error('FUNDER_SECRET_KEY no está configurada');
        }

        const server = new Horizon.Server(STELLAR_SERVER_URL);
        const fundsKeypair = StellarKeypair.fromSecret(FUNDER_SECRET_KEY);
        
        // Cargar cuenta de fondos
        const account = await server.loadAccount(fundsKeypair.publicKey());
        
        // Crear asset USDC
        const usdcAsset = new Asset(USDC_ASSET, USDC_ISSUER);

        // Crear transacción de pago
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(Operation.payment({
                destination: destination,
                asset: usdcAsset,
                amount: amount,
            }))
            .addMemo(Memo.text(memo))
            .setTimeout(180)
            .build();

        // Firmar y enviar transacción
        transaction.sign(fundsKeypair);
        const response = await server.submitTransaction(transaction);
        
        console.log("Transacción USDC enviada:", response.hash);
        return response.hash;
    } catch (error) {
        console.error('Error enviando USDC:', error);
        throw error;
    }
}

// Endpoint principal para crear cuenta y iniciar retiro MoneyGram
export async function POST(request: NextRequest) {
    try {
        const { pin, amount, userId } = await request.json();
        
        if (!pin) {
            return NextResponse.json({ 
                success: false, 
                error: 'PIN es requerido' 
            }, { status: 400 });
        }

        if (!amount) {
            return NextResponse.json({ 
                success: false, 
                error: 'Monto es requerido' 
            }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                error: 'ID de usuario es requerido' 
            }, { status: 400 });
        }

        // 1. Crear cuenta Stellar
        const accountResult = await createStellarAccount(pin);
        if (!accountResult.success) {
            return NextResponse.json(accountResult, { status: 400 });
        }

        // 2. Autenticar con MoneyGram
        const authToken = await authenticateWithMoneyGram();

        // 3. Iniciar transacción de retiro
        const { id: transactionId, url } = await initiateMoneyGramWithdrawal(authToken, amount, userId);

        // 4. Monitorear transacción hasta que esté lista
        const transactionInfo = await monitorMoneyGramTransaction(authToken, transactionId!);

        // 5. Enviar USDC a MoneyGram
        if (!transactionInfo.destination || !transactionInfo.amount || !transactionInfo.memo) {
            throw new Error('Información de transacción incompleta');
        }

        const stellarTransactionId = await sendUSDCToMoneyGram(
            transactionInfo.destination,
            transactionInfo.amount,
            transactionInfo.memo
        );

        return NextResponse.json({
            success: true,
            stellar: accountResult.stellar,
            moneygram: {
                transactionId,
                url,
                status: transactionInfo.status,
                stellarTransactionId
            }
        });

    } catch (error) {
        console.error('Error en endpoint MoneyGram:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        }, { status: 500 });
    }
}

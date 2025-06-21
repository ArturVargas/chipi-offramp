import { Wallet, SigningKeypair } from "@stellar/typescript-wallet-sdk";

// Configuración de MoneyGram
const MGI_ACCESS_HOST = "extmgxanchor.moneygram.com"; // Testnet
const USDC_ASSET = 'USDC';

export interface WithdrawalResult {
    id: string;
    url: string;
}

export interface TransactionInfo {
    status: string;
    destination?: string;
    memo?: string;
    amount?: string;
    transaction: unknown;
}

/**
 * Inicia una transacción de retiro con MoneyGram
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initiateMoneyGramWithdrawal = async (authToken: any, amount: string, userId: string, fundsSecretKey: string): Promise<WithdrawalResult> => {
    try {
        const wallet = Wallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        // Verificar que MoneyGram soporte USDC
        const info = await anchor.getInfo();
        console.log('Currencies soportadas:', info.currencies);

        const currency = info.currencies.find(({ code }) => code === USDC_ASSET);
        if (!currency?.code || !currency?.issuer) {
            throw new Error(`MoneyGram no soporta ${USDC_ASSET} o no está configurado correctamente`);
        }

        // Create keypair for the funds account
        const fundsKeypair = SigningKeypair.fromSecret(fundsSecretKey);
        
        // Start withdrawal transaction
        const { url, id } = await anchor.sep24().withdraw({
            authToken: authToken,
            withdrawalAccount: fundsKeypair.publicKey,
            assetCode: USDC_ASSET,
            lang: "en", // English
            extraFields: {
                amount: amount,
                // Additional fields specific to MoneyGram
                country: "TR", // Turkey
                state: "IST", // Istanbul
                user_id: userId
            },
        });

        console.log('Transacción de retiro iniciada:', { id, url });
        return { id: id!, url: url! };
    } catch (error) {
        console.error('Error iniciando retiro MoneyGram:', error);
        throw error;
    }
};

/**
 * Monitors a MoneyGram transaction until it is ready to receive funds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const monitorMoneyGramTransaction = async (authToken: any, transactionId: string): Promise<TransactionInfo> => {
    try {
        const wallet = Wallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        // Create watcher to monitor the transaction
        const watcher = anchor.sep24().watcher();
        
        return new Promise<TransactionInfo>((resolve, reject) => {
            const { stop } = watcher.watchOneTransaction({
                authToken,
                assetCode: USDC_ASSET,
                id: transactionId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMessage: (transaction: any) => {
                    console.log(`Estado de transacción: ${transaction.status}`);
                    
                    if (transaction.status === "pending_user_transfer_start") {
                        // MoneyGram is ready to receive funds
                        resolve({
                            status: transaction.status,
                            destination: transaction.withdraw_anchor_account || '',
                            memo: transaction.withdraw_memo || '',
                            amount: transaction.amount_in || '',
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
}; 
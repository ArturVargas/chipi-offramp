import { Wallet, SigningKeypair, IssuedAssetId } from "@stellar/typescript-wallet-sdk";
import { ANCHOR_HOST, USDC_ASSET, MAX_POLLING_ATTEMPTS } from '@/lib/config';
import { Horizon } from '@stellar/stellar-sdk';

// Configuración de MoneyGram
const MGI_ACCESS_HOST = "extmgxanchor.moneygram.com"; // Testnet
// const USDC_ASSET = 'USDC';

export interface WithdrawalResult {
    id: string;
    url: string;
}

export interface TransactionInfo {
    status: string;
    destination?: string;
    memo?: string;
    amount?: string;
    external_transaction_id?: string;
    more_info_url?: string;
    stellarTransactionId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: any;
}

export interface TransactionStatus {
    id: string;
    status: string;
    destination?: string;
    memo?: string;
    amount?: string;
    stellarTransactionId?: string;
    externalTransactionId?: string;
}

/**
 * Initiates a withdrawal transaction with the configured anchor
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function initiateMoneyGramWithdrawal(authToken: any, amount: string, userId: string, fundsSecretKey: string): Promise<{ id: string; url: string }> {
    try {
        console.log(`Initiating withdrawal with anchor: ${ANCHOR_HOST}`);
        
        // Create wallet instance
        const wallet = Wallet.TestNet();

        // Create keypair for the funds account
        const fundsKeypair = SigningKeypair.fromSecret(fundsSecretKey);
        
        // Start withdrawal transaction
        const anchor = wallet.anchor({ homeDomain: ANCHOR_HOST });
        
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

        console.log('Withdrawal transaction initiated:', { id, url });
        return { id: id!, url: url! };
    } catch (error) {
        console.error('Error initiating withdrawal:', error);
        throw error;
    }
}

/**
 * Monitors a MoneyGram transaction until it is ready to receive funds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTransactionStatus = async (authToken: any, transactionId: string): Promise<TransactionStatus> => {
    try {
        const wallet = Wallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        // Get transaction by ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transaction: any = await anchor.sep24().getTransactionBy({
            authToken,
            id: transactionId,
        });

        console.log('Estado de transacción obtenido:', transaction.status);

        return {
            id: transaction.id || '',
            status: transaction.status || '',
            destination: transaction.withdraw_anchor_account || '',
            memo: transaction.withdraw_memo || '',
            amount: transaction.amount_in || '',
            stellarTransactionId: transaction.stellar_transaction_id || '',
            externalTransactionId: transaction.external_transaction_id || ''
        };
    } catch (error) {
        console.error('Error obteniendo estado de transacción:', error);
        throw error;
    }
};

/**
 * Monitors a transaction until it is ready to receive funds using the watcher
 * Implements robust polling according to the documentation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function monitorMoneyGramTransaction(authToken: any, transactionId: string, fundsSecretKey: string): Promise<TransactionInfo> {
    try {
        console.log(`Monitoring transaction ${transactionId} with anchor: ${ANCHOR_HOST}`);
        
        // Create wallet instance
        const wallet = Wallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: ANCHOR_HOST });
        
        // Create funds keypair
        const fundsKeypair = SigningKeypair.fromSecret(fundsSecretKey);
        
        // Get anchor info to verify USDC support
        const info = await anchor.getInfo();
        console.log('Supported currencies:', info.currencies);
        
        const currency = info.currencies.find(({ code }) => code === USDC_ASSET);
        if (!currency?.code || !currency?.issuer) {
            throw new Error(`Anchor does not support ${USDC_ASSET} asset or is not correctly configured`);
        }
        
        // Create Stellar asset object
        const asset = new IssuedAssetId(currency.code, currency.issuer);
        
        // Create Stellar instance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stellar: any = wallet.stellar();
        
        return new Promise<TransactionInfo>((resolve, reject) => {
            let attempts = 0;
            
            // Create watcher for transaction monitoring
            const watcher = anchor.sep24().watcher();
            
            const { stop } = watcher.watchOneTransaction({
                authToken,
                assetCode: USDC_ASSET,
                id: transactionId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMessage: async (transaction: any) => {
                    attempts++;
                    console.log(`Transaction status (attempt ${attempts}): ${transaction.status}`);
                    
                    if (transaction.status === "pending_user_transfer_start") {
                        console.log('Anchor is ready to receive funds!');
                        console.log('Transaction details:', transaction);
                        
                        try {
                            // Send funds to anchor
                            const stellarTransactionId = await sendFundsToAnchor(
                                stellar,
                                fundsKeypair,
                                transaction,
                                asset
                            );
                            
                            resolve({
                                status: transaction.status || 'pending_user_transfer_start',
                                destination: transaction.withdraw_anchor_account,
                                memo: transaction.withdraw_memo,
                                amount: transaction.amount_in,
                                transaction: transaction,
                                stellarTransactionId
                            });
                        } catch (error) {
                            console.error('Error sending funds to anchor:', error);
                            reject(error);
                        }
                        
                        stop();
                    } else if (transaction.status === "pending_user_transfer_complete") {
                        console.log('Transaction completed! Reference number:', transaction.external_transaction_id);
                        console.log('More info URL:', transaction.more_info_url);
                        
                        resolve({
                            status: transaction.status || 'pending_user_transfer_complete',
                            external_transaction_id: transaction.external_transaction_id,
                            more_info_url: transaction.more_info_url,
                            transaction: transaction
                        });
                        stop();
                    } else if (attempts >= MAX_POLLING_ATTEMPTS) {
                        console.error('Timeout for transaction');
                        reject(new Error('Timeout for transaction'));
                        stop();
                    }
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onSuccess: (transaction: any) => {
                    console.log('Transaction completed successfully:', transaction.status);
                    resolve({
                        status: transaction.status || 'completed',
                        external_transaction_id: transaction.external_transaction_id,
                        more_info_url: transaction.more_info_url,
                        transaction: transaction
                    });
                    stop();
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    console.error('Error in transaction:', error);
                    reject(new Error(`Error in transaction: ${error.message || error}`));
                    stop();
                },
            });
        });
    } catch (error) {
        console.error('Error monitoring transaction:', error);
        throw error;
    }
}

/**
 * Sends funds to the anchor using the transaction details
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendFundsToAnchor(
    stellar: any,
    fundsKeypair: SigningKeypair,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: any,
    asset: IssuedAssetId
): Promise<string> {
    try {
        console.log('Sending funds to anchor...');
        console.log('Transaction details:', {
            withdraw_anchor_account: transaction.withdraw_anchor_account,
            withdraw_memo: transaction.withdraw_memo,
            amount_in: transaction.amount_in
        });
        
        // Create transaction builder
        const txBuilder = await stellar.transaction({
            sourceAddress: fundsKeypair.publicKey,
            baseFee: 10000, // 0.001 XLM
            timebounds: 180, // 3 minutes
        });
        
        // Build transfer withdrawal transaction
        const transferTransaction = txBuilder
            .transferWithdrawalTransaction(transaction, asset)
            .build();
        
        // Sign with funds account
        transferTransaction.sign(fundsKeypair);
        
        // Submit to Stellar network
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await stellar.submitTransaction(transferTransaction);
        console.log('Stellar transaction submitted successfully:', response.id);
        
        return response.id;
    } catch (error) {
        console.error('Error submitting Stellar transaction:', error);
        
        // Handle specific errors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData = (error as any).response?.data;
        const sdkResultCodes = Horizon.HorizonApi.TransactionFailedResultCodes;
        
        if (
            errorData?.status === 400 &&
            errorData?.extras?.result_codes?.transaction === sdkResultCodes.TX_BAD_SEQ
        ) {
            console.log('Invalid sequence number, retrying with updated sequence...');
            
            // Create new transaction builder with updated sequence
            const txBuilder2 = await stellar.transaction({
                sourceAddress: fundsKeypair.publicKey,
                baseFee: 10000,
                timebounds: 180,
            });
            
            const transferTransaction2 = txBuilder2
                .transferWithdrawalTransaction(transaction, asset)
                .build();
            
            transferTransaction2.sign(fundsKeypair);
            
            const response2 = await stellar.submitTransaction(transferTransaction2);
            console.log('Stellar transaction submitted on retry:', response2.id);
            
            return response2.id;
        }
        
        throw error;
    }
}

/**
 * Gets all transactions for a specific asset
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTransactionsForAsset = async (authToken: any): Promise<any[]> => {
    try {
        const wallet = Wallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        const transactions = await anchor.sep24().getTransactionsForAsset({
            authToken,
            assetCode: USDC_ASSET,
        });

        console.log('Transacciones obtenidas:', transactions.length);
        return transactions;
    } catch (error) {
        console.error('Error obteniendo transacciones:', error);
        throw error;
    }
}; 
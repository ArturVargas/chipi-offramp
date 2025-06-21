import { Keypair as StellarKeypair, Networks, TransactionBuilder, Operation, BASE_FEE, Asset, Horizon, Memo } from "@stellar/stellar-sdk";

// Stellar configuration
const STELLAR_SERVER_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// USDC configuration
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'; // Testnet
const USDC_ASSET = 'USDC';

/**
 * Sends USDC to a destination account using Stellar SDK
 */
export const sendUSDCToDestination = async (
    destination: string, 
    amount: string, 
    memo: string, 
    fundsSecretKey: string
): Promise<string> => {
    try {
        if (!fundsSecretKey) {
            throw new Error('FUNDS_SECRET_KEY no está configurada');
        }

        const server = new Horizon.Server(STELLAR_SERVER_URL);
        const fundsKeypair = StellarKeypair.fromSecret(fundsSecretKey);
        
        // Load funds account
        const account = await server.loadAccount(fundsKeypair.publicKey());
        
        // Create USDC asset
        const usdcAsset = new Asset(USDC_ASSET, USDC_ISSUER);

        // Create payment transaction
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

        // Sign and send transaction
        transaction.sign(fundsKeypair);
        const response = await server.submitTransaction(transaction);
        
        console.log("USDC transaction sent:", response.hash);
        return response.hash;
    } catch (error) {
        console.error('Error sending USDC:', error);
        throw error;
    }
}; 
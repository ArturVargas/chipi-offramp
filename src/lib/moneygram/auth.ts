import { Wallet, SigningKeypair } from "@stellar/typescript-wallet-sdk";

// Configuración de MoneyGram
const MGI_ACCESS_HOST = "extmgxanchor.moneygram.com"; // Testnet
// const MGI_ACCESS_HOST = "stellar.moneygram.com"; // Production

/**
 * SEP-10 Auth with MoneyGram using the official library
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authenticateWithMoneyGram = async (authSecretKey: string): Promise<any> => {
    try {
        if (!authSecretKey) {
            throw new Error('AUTH_SECRET_KEY is not configured');
        }

        console.log('Starting SEP-10 Auth with MoneyGram...');
        
        // Create wallet and anchor
        const wallet = Wallet.TestNet();
        const anchor = wallet.anchor({ homeDomain: MGI_ACCESS_HOST });
        
        // Create sep10 object to handle authentication
        const sep10 = await anchor.sep10();
        
        // Create authentication keypair
        const authKey = SigningKeypair.fromSecret(authSecretKey);
        console.log('Auth Public Key:', authKey.publicKey);
        
        // Authenticate using the library method
        const authToken = await sep10.authenticate({ accountKp: authKey });
        
        console.log('SEP-10 Auth with MoneyGram successful');
        return authToken;
    } catch (error) {
        console.error('Error en autenticación MoneyGram:', error);
        throw error;
    }
}; 
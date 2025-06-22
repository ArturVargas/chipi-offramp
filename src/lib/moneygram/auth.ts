import { Wallet, SigningKeypair } from '@stellar/typescript-wallet-sdk';
import { ANCHOR_HOST } from '@/lib/config';

/**
 * Authenticates with the configured anchor (SDF Test Anchor or MoneyGram)
 * Uses SEP-10 authentication protocol
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function authenticateWithMoneyGram(authSecretKey: string): Promise<any> {
    try {
        console.log(`Authenticating with anchor: ${ANCHOR_HOST}`);
        
        // Create wallet instance
        const wallet = Wallet.TestNet();

        // Create keypair for authentication
        const authKeypair = SigningKeypair.fromSecret(authSecretKey);
        console.log('Auth Public Key:', authKeypair.publicKey);

        // Authenticate with the configured anchor
        const anchor = wallet.anchor({ homeDomain: ANCHOR_HOST });
        
        // Perform SEP-10 authentication
        const sep10 = await anchor.sep10();
        const authToken = await sep10.authenticate({ accountKp: authKeypair });

        console.log(`SEP-10 Auth with ${ANCHOR_HOST} successful`);
        return authToken;
    } catch (error) {
        console.error(`Error authenticating with ${ANCHOR_HOST}:`, error);
        throw error;
    }
} 
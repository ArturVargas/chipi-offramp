// Configuración de Stellar
export const STELLAR_CONFIG = {
    SERVER_URL: 'https://horizon-testnet.stellar.org',
    NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
    MINIMUM_BALANCE: '2',
    USDC: {
        ISSUER: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', // Testnet
        ASSET: 'USDC'
    }
} as const;

// MoneyGram configuration
export const MONEYGRAM_CONFIG = {
    TESTNET: {
        HOST: "extmgxanchor.moneygram.com",
        AUTH_ENDPOINT: "https://extstellar.moneygram.com/stellaradapterservice/auth"
    },
    PRODUCTION: {
        HOST: "stellar.moneygram.com",
        AUTH_ENDPOINT: "https://stellar.moneygram.com/stellaradapterservice/auth"
    }
} as const;

// Application configuration
export const APP_CONFIG = {
    NAME: 'Chipi Offramp',
    VERSION: '1.0.0',
    DEFAULT_LANGUAGE: 'en',
    DEFAULT_COUNTRY: 'TR',
    DEFAULT_STATE: 'IST'
} as const;

// Stellar Network Configuration
export const STELLAR_NETWORK = process.env.STELLAR_NETWORK || 'testnet';
export const STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

// MoneyGram Configuration
export const MGI_ACCESS_HOST = process.env.MGI_ACCESS_HOST || 'extmganchor.moneygram.com';
export const MGI_ACCESS_URL = `https://${MGI_ACCESS_HOST}`;

// SDF Test Anchor Configuration (for development)
export const SDF_TEST_ANCHOR_HOST = 'testanchor.stellar.org';
export const SDF_TEST_ANCHOR_URL = `https://${SDF_TEST_ANCHOR_HOST}`;

// Use SDF Test Anchor for development if MONEYGRAM_USE_SDF_ANCHOR is set
export const USE_SDF_ANCHOR = process.env.MONEYGRAM_USE_SDF_ANCHOR === 'true';
export const ANCHOR_HOST = USE_SDF_ANCHOR ? SDF_TEST_ANCHOR_HOST : MGI_ACCESS_HOST;
export const ANCHOR_URL = USE_SDF_ANCHOR ? SDF_TEST_ANCHOR_URL : MGI_ACCESS_URL;

// USDC Asset Configuration
export const USDC_ASSET = 'USDC';
export const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

// Minimum XLM balance for new accounts
export const MIN_XLM_BALANCE = '1.0';

// Polling configuration
export const POLLING_INTERVAL = 2000; // 2 seconds
export const MAX_POLLING_ATTEMPTS = 150; // 5 minutes total 
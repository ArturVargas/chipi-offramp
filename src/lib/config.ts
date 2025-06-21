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
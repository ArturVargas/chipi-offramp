import { NextRequest, NextResponse } from "next/server";
import { USDC_ISSUER } from '@/lib/config';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const accountPublicKey = searchParams.get('account');
        
        if (!accountPublicKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'Account public key is required' 
            }, { status: 400 });
        }

        const fundsSecretKey = process.env.MONEYGRAM_FUNDS_SECRET_KEY;
        if (!fundsSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_FUNDS_SECRET_KEY is not configured' 
            }, { status: 500 });
        }

        // Conectar a Horizon usando fetch
        const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${accountPublicKey}`);
        
        if (!response.ok) {
            return NextResponse.json({
                success: false,
                error: 'Account not found or not funded',
                account: accountPublicKey
            }, { status: 404 });
        }

        const account = await response.json();
            
        // Buscar balance de USDC
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const usdcBalance = account.balances.find((balance: any) => 
            balance.asset_type === 'credit_alphanum4' && 
            balance.asset_code === 'USDC' && 
            balance.asset_issuer === USDC_ISSUER
        );

        // Buscar balance de XLM
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xlmBalance = account.balances.find((balance: any) => 
            balance.asset_type === 'native'
        );

        return NextResponse.json({
            success: true,
            account: accountPublicKey,
            balances: {
                xlm: xlmBalance ? {
                    balance: xlmBalance.balance,
                    limit: xlmBalance.limit
                } : null,
                usdc: usdcBalance ? {
                    balance: usdcBalance.balance,
                    limit: usdcBalance.limit,
                    issuer: usdcBalance.asset_issuer
                } : null
            },
            hasUsdcTrustline: !!usdcBalance,
            canSendUsdc: usdcBalance && parseFloat(usdcBalance.balance) > 0
        });

    } catch (error) {
        console.error('Error checking balance:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
} 
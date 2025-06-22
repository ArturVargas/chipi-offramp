import { NextRequest, NextResponse } from "next/server";
import { authenticateWithMoneyGram } from "@/lib/moneygram/auth";
import { monitorMoneyGramTransaction } from "@/lib/moneygram/transactions";

/**
 * Endpoint para enviar fondos cuando el usuario completa KYC
 * Este endpoint se llama después de que el webview se cierra
 */
export async function POST(request: NextRequest) {
    try {
        const { transactionId } = await request.json();
        
        if (!transactionId) {
            return NextResponse.json({ 
                success: false, 
                error: 'Transaction ID is required' 
            }, { status: 400 });
        }

        // Verificar variables de entorno
        const authSecretKey = process.env.MONEYGRAM_AUTH_SECRET_KEY;
        const fundsSecretKey = process.env.MONEYGRAM_FUNDS_SECRET_KEY;

        if (!authSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_AUTH_SECRET_KEY is not configured' 
            }, { status: 500 });
        }

        if (!fundsSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_FUNDS_SECRET_KEY is not configured' 
            }, { status: 500 });
        }

        // 1. Autenticar con el anchor
        const authToken = await authenticateWithMoneyGram(authSecretKey);

        // 2. Monitorear transacción y enviar fondos
        const transactionInfo = await monitorMoneyGramTransaction(authToken, transactionId, fundsSecretKey);

        return NextResponse.json({
            success: true,
            status: transactionInfo.status,
            stellarTransactionId: transactionInfo.stellarTransactionId,
            externalTransactionId: transactionInfo.external_transaction_id,
            moreInfoUrl: transactionInfo.more_info_url
        });

    } catch (error) {
        console.error('Error sending funds:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
} 
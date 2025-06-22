import { NextRequest, NextResponse } from "next/server";
import { authenticateWithMoneyGram } from "@/lib/moneygram/auth";
import { initiateMoneyGramWithdrawal, getTransactionStatus } from "@/lib/moneygram/transactions";

/**
 * Endpoint to start the MoneyGram webview flow
 * This endpoint starts the transaction and returns the URL to open in webview
 */
export async function POST(request: NextRequest) {
    try {
        const { amount, userId } = await request.json();
        
        if (!amount) {
            return NextResponse.json({ 
                success: false, 
                error: 'Amount is required' 
            }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                error: 'User ID is required' 
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

        // 1. Autenticar con MoneyGram
        const authToken = await authenticateWithMoneyGram(authSecretKey);

        // 2. Iniciar transacción de retiro
        const { id: transactionId, url } = await initiateMoneyGramWithdrawal(authToken, amount, userId, fundsSecretKey);

        return NextResponse.json({
            success: true,
            transactionId,
            webviewUrl: url,
            instructions: {
                openInWebview: true,
                listenForPostMessage: true,
                expectedStatus: "pending_user_transfer_start"
            }
        });

    } catch (error) {
        console.error('Error in webview endpoint:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}

/**
 * Endpoint to verify the status after the postMessage
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');
        
        if (!transactionId) {
            return NextResponse.json({ 
                success: false, 
                error: 'transactionId is required' 
            }, { status: 400 });
        }

        const authSecretKey = process.env.MONEYGRAM_AUTH_SECRET_KEY;
        if (!authSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_AUTH_SECRET_KEY is not configured' 
            }, { status: 500 });
        }

        // Autenticar con MoneyGram
        const authToken = await authenticateWithMoneyGram(authSecretKey);

        // Obtener estado actual de la transacción
        const transactionStatus = await getTransactionStatus(authToken, transactionId);

        return NextResponse.json({
            success: true,
            transaction: transactionStatus,
            nextSteps: getNextSteps(transactionStatus.status)
        });

    } catch (error) {
        console.error('Error verifying post-webview status:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}

/**
 * Determina los siguientes pasos basado en el estado de la transacción
 */
function getNextSteps(status: string): string[] {
    switch (status) {
        case 'incomplete':
            return ['Wait for the user to complete KYC in MoneyGram'];
        case 'pending_user_transfer_start':
            return [
                'User completed KYC in MoneyGram',
                'MoneyGram is ready to receive USDC',
                'Send USDC to the specified account',
                'Close webview'
            ];
        case 'pending_user_transfer_complete':
            return ['USDC sent, waiting for MoneyGram confirmation'];
        case 'completed':
            return ['Transaction completed successfully'];
        case 'error':
            return ['Error in transaction, check logs'];
        default:
            return ['Unknown status, monitor transaction'];
    }
} 
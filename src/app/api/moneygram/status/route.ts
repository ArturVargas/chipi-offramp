import { NextRequest, NextResponse } from "next/server";
import { authenticateWithMoneyGram } from "@/lib/moneygram/auth";
import { monitorMoneyGramTransaction } from "@/lib/moneygram/transactions";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');
        
        if (!transactionId) {
            return NextResponse.json({ 
                success: false, 
                error: 'transactionId es requerido' 
            }, { status: 400 });
        }

        const authSecretKey = process.env.MONEYGRAM_AUTH_SECRET_KEY;
        if (!authSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_AUTH_SECRET_KEY no está configurada' 
            }, { status: 500 });
        }

        // Autenticar con MoneyGram
        const authToken = await authenticateWithMoneyGram(authSecretKey);

        // Obtener estado de la transacción
        const transactionInfo = await monitorMoneyGramTransaction(authToken, transactionId);

        return NextResponse.json({
            success: true,
            transaction: {
                id: transactionId,
                status: transactionInfo.status,
                destination: transactionInfo.destination,
                memo: transactionInfo.memo,
                amount: transactionInfo.amount
            }
        });

    } catch (error) {
        console.error('Error en endpoint status:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        }, { status: 500 });
    }
} 
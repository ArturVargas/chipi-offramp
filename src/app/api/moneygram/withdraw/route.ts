import { NextRequest, NextResponse } from "next/server";
import { authenticateWithMoneyGram } from "@/lib/moneygram/auth";
import { initiateMoneyGramWithdrawal, monitorMoneyGramTransaction } from "@/lib/moneygram/transactions";
import { sendUSDCToDestination } from "@/lib/stellar/payments";

export async function POST(request: NextRequest) {
    try {
        const { amount, userId } = await request.json();
        
        if (!amount) {
            return NextResponse.json({ 
                success: false, 
                error: 'Monto es requerido' 
            }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                error: 'ID de usuario es requerido' 
            }, { status: 400 });
        }

        // Verificar variables de entorno
        const authSecretKey = process.env.MONEYGRAM_AUTH_SECRET_KEY;
        const fundsSecretKey = process.env.MONEYGRAM_FUNDS_SECRET_KEY;

        if (!authSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_AUTH_SECRET_KEY no está configurada' 
            }, { status: 500 });
        }

        if (!fundsSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_FUNDS_SECRET_KEY no está configurada' 
            }, { status: 500 });
        }

        // 1. Autenticar con MoneyGram
        const authToken = await authenticateWithMoneyGram(authSecretKey);

        // 2. Iniciar transacción de retiro
        const { id: transactionId, url } = await initiateMoneyGramWithdrawal(authToken, amount, userId, fundsSecretKey);

        // 3. Monitorear transacción hasta que esté lista
        const transactionInfo = await monitorMoneyGramTransaction(authToken, transactionId);

        // 4. Enviar USDC a MoneyGram
        if (!transactionInfo.destination || !transactionInfo.amount || !transactionInfo.memo) {
            throw new Error('Información de transacción incompleta');
        }

        const stellarTransactionId = await sendUSDCToDestination(
            transactionInfo.destination,
            transactionInfo.amount,
            transactionInfo.memo,
            fundsSecretKey
        );

        return NextResponse.json({
            success: true,
            moneygram: {
                transactionId,
                url,
                status: transactionInfo.status,
                stellarTransactionId
            }
        });

    } catch (error) {
        console.error('Error en endpoint withdraw:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        }, { status: 500 });
    }
} 
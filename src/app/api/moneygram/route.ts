import { NextRequest, NextResponse } from "next/server";
import { createStellarAccountWithTrustline } from "@/lib/stellar/account";
import { authenticateWithMoneyGram } from "@/lib/moneygram/auth";
import { initiateMoneyGramWithdrawal, monitorMoneyGramTransaction } from "@/lib/moneygram/transactions";

/**
 * Endpoint principal para flujo completo: crear cuenta + retiro MoneyGram
 * 
 * Este endpoint combina:
 * 1. Creación de cuenta Stellar con trustline USDC
 * 2. Autenticación SEP-10 con MoneyGram
 * 3. Inicio de transacción de retiro
 * 4. Monitoreo hasta que esté lista
 * 5. Envío de USDC a MoneyGram
 */
export async function POST(request: NextRequest) {
    try {
        const { pin, amount, userId } = await request.json();
        
        if (!pin) {
            return NextResponse.json({ 
                success: false, 
                error: 'PIN es requerido' 
            }, { status: 400 });
        }

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
        const funderSecretKey = process.env.STELLAR_FUNDER_SECRET_KEY;
        const authSecretKey = process.env.MONEYGRAM_AUTH_SECRET_KEY;
        const fundsSecretKey = process.env.MONEYGRAM_FUNDS_SECRET_KEY;

        if (!funderSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'STELLAR_FUNDER_SECRET_KEY no está configurada' 
            }, { status: 500 });
        }

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

        // 1. Crear cuenta Stellar con trustline USDC
        const accountResult = await createStellarAccountWithTrustline(pin, funderSecretKey);
        if (!accountResult.success) {
            return NextResponse.json(accountResult, { status: 400 });
        }

        // 2. Autenticar con MoneyGram
        const authToken = await authenticateWithMoneyGram(authSecretKey);

        // 3. Iniciar transacción de retiro
        const { id: transactionId, url } = await initiateMoneyGramWithdrawal(authToken, amount, userId, fundsSecretKey);

        // 4. Monitorear transacción hasta que esté lista y enviar fondos
        const transactionInfo = await monitorMoneyGramTransaction(authToken, transactionId, fundsSecretKey);

        // 5. Verificar que se enviaron los fondos correctamente
        if (!transactionInfo.stellarTransactionId) {
            throw new Error('No se pudo enviar USDC al anchor');
        }

        return NextResponse.json({
        success: true,
            stellar: accountResult.stellar,
            moneygram: {
                transactionId,
                url,
                status: transactionInfo.status,
                stellarTransactionId: transactionInfo.stellarTransactionId,
                externalTransactionId: transactionInfo.external_transaction_id,
                moreInfoUrl: transactionInfo.more_info_url
            }
        });

    } catch (error) {
        console.error('Error en endpoint principal MoneyGram:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        }, { status: 500 });
}
} 
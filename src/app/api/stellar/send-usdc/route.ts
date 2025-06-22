import { NextRequest, NextResponse } from "next/server";
import { sendUSDCToDestination } from "@/lib/stellar/payments";

export async function POST(request: NextRequest) {
    try {
        const { destination, amount, memo } = await request.json();
        
        if (!destination || !amount) {
            return NextResponse.json({ 
                success: false, 
                error: '`destination` y `amount` son requeridos' 
            }, { status: 400 });
        }

        const fundsSecretKey = process.env.MONEYGRAM_FUNDS_SECRET_KEY;
        if (!fundsSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'MONEYGRAM_FUNDS_SECRET_KEY no está configurada' 
            }, { status: 500 });
        }

        // Enviar USDC a la cuenta de destino
        const transactionHash = await sendUSDCToDestination(
            destination, 
            amount, 
            memo || 'USDC deposit', 
            fundsSecretKey
        );
        
        return NextResponse.json({
            success: true,
            transactionHash: transactionHash
        });

    } catch (error) {
        console.error('Error en endpoint send-usdc:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        }, { status: 500 });
    }
} 
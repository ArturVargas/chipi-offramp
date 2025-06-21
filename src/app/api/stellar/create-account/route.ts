import { NextRequest, NextResponse } from "next/server";
import { createStellarAccountWithTrustline } from "@/lib/stellar/account";

export async function POST(request: NextRequest) {
    try {
        const { pin } = await request.json();
        
        if (!pin) {
            return NextResponse.json({ 
                success: false, 
                error: 'PIN es requerido' 
            }, { status: 400 });
        }

        const funderSecretKey = process.env.STELLAR_FUNDER_SECRET_KEY;
        if (!funderSecretKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'STELLAR_FUNDER_SECRET_KEY no está configurada' 
            }, { status: 500 });
        }

        // Crear cuenta Stellar con trustline USDC
        const result = await createStellarAccountWithTrustline(pin, funderSecretKey);
        
        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            stellar: result.stellar,
            transactionHash: result.transactionHash
        });

    } catch (error) {
        console.error('Error en endpoint create-account:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Error interno del servidor' 
        }, { status: 500 });
    }
} 
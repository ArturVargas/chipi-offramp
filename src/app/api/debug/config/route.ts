import { NextResponse } from "next/server";

export async function GET() {
    try {
        const config = {
            MONEYGRAM_AUTH_SECRET_KEY: process.env.MONEYGRAM_AUTH_SECRET_KEY ? 'configured' : 'not configured',
            MONEYGRAM_FUNDS_SECRET_KEY: process.env.MONEYGRAM_FUNDS_SECRET_KEY ? 'configured' : 'not configured',
            STELLAR_FUNDER_SECRET_KEY: process.env.STELLAR_FUNDER_SECRET_KEY ? 'configured' : 'not configured',
            MONEYGRAM_USE_SDF_ANCHOR: process.env.MONEYGRAM_USE_SDF_ANCHOR,
            ANCHOR_HOST: process.env.MONEYGRAM_USE_SDF_ANCHOR === 'true' ? 'testanchor.stellar.org' : 'extmganchor.moneygram.com'
        };

        return NextResponse.json({
            success: true,
            config
        });

    } catch (error) {
        console.error('Error getting config:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
} 
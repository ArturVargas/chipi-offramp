export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { usdcContract, wallet } from '@/lib/bridge/web3';
import { sendUSDCStellar } from '@/lib/bridge/stellar';
import { ethers } from 'ethers';

let pollingInterval: NodeJS.Timeout | null = null;

export async function POST(req: NextRequest) {
  if (pollingInterval) {
    return NextResponse.json({ status: 'Polling already running' });
  }

  // Start polling for transfers every 10 seconds
  pollingInterval = setInterval(async () => {
    try {
      console.log('⏱️ Polling ejecutado...');
      // Get the latest block number
      const latestBlock = await usdcContract.runner?.provider?.getBlockNumber();
      if (!latestBlock) return;

      // Check transfers in the last 10 blocks
      const fromBlock = latestBlock - 10;
      
      // Get transfer events
      const events = await usdcContract.queryFilter(
        usdcContract.filters.Transfer(null, wallet.address),
        fromBlock,
        latestBlock
      );
      console.log(`🔍 Revisando eventos de bloque ${fromBlock} a ${latestBlock}, encontrados: ${events.length}`);

      for (const event of events) {
        console.log("🧾 Evento:", event.args);
        if (event.args && event.args.to.toLowerCase() === wallet.address.toLowerCase()) {
          const amountUSDC = ethers.formatUnits(event.args.amount, 6);
          const stellarTo = process.env.STELLAR_DESTINATION!;
          console.log(`🔔 ${amountUSDC} USDC detectado desde ${event.args.from}`);

          try {
            const result = await sendUSDCStellar(stellarTo, amountUSDC);
            console.log('✅ Enviado a Stellar:', result.hash);
          } catch (err) {
            console.error('❌ Error al enviar en Stellar:', err);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error en polling:', err);
    }
  }, 10000); // Poll every 10 seconds

  return NextResponse.json({ status: 'Polling iniciado' });
}

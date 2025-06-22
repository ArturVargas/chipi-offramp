import { NextRequest, NextResponse } from 'next/server';
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits
} from 'viem';
import { arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { StrKey } from 'stellar-sdk';

const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY! as `0x${string}`;
const USDC_ADDRESS = process.env.USDC_ADDRESS! as `0x${string}`;
const ALLBRIDGE_CONTRACT = process.env.ALLBRIDGE_CONTRACT! as `0x${string}`;

// ABI mínimas necesarias
const usdcAbi = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
];

const bridgeAbi = [
  {
    type: 'function',
    name: 'swapAndBridge',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'bytes' },
      { name: 'amount', type: 'uint256' },
      { name: 'targetChainId', type: 'uint8' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'bridge',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'bytes' },
      { name: 'amount', type: 'uint256' },
      { name: 'targetChainId', type: 'uint8' }
    ],
    outputs: []
  }
];

export async function POST(req: NextRequest) {
  try {
    const { amount, destinationAddress } = await req.json();

    if (!amount || !destinationAddress) {
      return NextResponse.json({ error: 'Missing amount or destinationAddress' }, { status: 400 });
    }

    const account = privateKeyToAccount(PRIVATE_KEY);

    const publicClient = createPublicClient({
      chain: arbitrum,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: arbitrum,
      transport: http(RPC_URL),
    });

    const parsedAmount = parseUnits(amount.toString(), 6); // USDC has 6 decimals

    // ✅ Decode Stellar address to raw ed25519 public key (32 bytes)
    let recipientBytes: Uint8Array;
    try {
      recipientBytes = StrKey.decodeEd25519PublicKey(destinationAddress); // throws if invalid
    } catch {
      return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
    }

    // 1. Approve USDC
    const { request: approveRequest } = await publicClient.simulateContract({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'approve',
      args: [ALLBRIDGE_CONTRACT, parsedAmount],
      account,
    });

    const approveTxHash = await walletClient.writeContract(approveRequest);
    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

    // 2. Call swapAndBridge
    const STELLAR_CHAIN_ID = 9;
    
    // Convert Uint8Array to hex string
    const recipientHex = `0x${Buffer.from(recipientBytes).toString('hex')}` as `0x${string}`;

    // Try swapAndBridge first, then bridge as fallback
    try {
      console.log("Trying swapAndBridge...");
      const { request: bridgeRequest } = await publicClient.simulateContract({
        address: ALLBRIDGE_CONTRACT,
        abi: bridgeAbi,
        functionName: 'swapAndBridge',
        args: [recipientHex, parsedAmount, STELLAR_CHAIN_ID],
        account,
      });

      const bridgeTxHash = await walletClient.writeContract(bridgeRequest);
      await publicClient.waitForTransactionReceipt({ hash: bridgeTxHash });
      return NextResponse.json({ status: 'ok', txHash: bridgeTxHash, method: 'swapAndBridge' });
    } catch (swapError: any) {
      console.log("swapAndBridge failed:", swapError.message);
      
      // Try bridge function as fallback
      console.log("Trying bridge...");
      const { request: bridgeRequest } = await publicClient.simulateContract({
        address: ALLBRIDGE_CONTRACT,
        abi: bridgeAbi,
        functionName: 'bridge',
        args: [recipientHex, parsedAmount, STELLAR_CHAIN_ID],
        account,
      });

      const bridgeTxHash = await walletClient.writeContract(bridgeRequest);
      await publicClient.waitForTransactionReceipt({ hash: bridgeTxHash });
      return NextResponse.json({ status: 'ok', txHash: bridgeTxHash, method: 'bridge' });
    }

  } catch (err: any) {
    console.error('Bridge error:', err);
    return NextResponse.json({ error: 'Bridge failed', details: err.message }, { status: 500 });
  }
}

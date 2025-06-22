import { ethers } from 'ethers';

export const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL!);
export const wallet = new ethers.Wallet(process.env.ARBITRUM_PRIVATE_KEY!, provider);

export const USDC_ADDRESS = process.env.USDC_ADDRESS!;
export const usdcAbi = [
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

export const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);

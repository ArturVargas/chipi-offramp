# 🌉 Chipi Offramp

Team
Arturo Castanon - arturo.spameame18@gmail.com 
Erik Valle - erik.valle@gmail.com

## 💻 Project Description:

This project enables a seamless **offramp from the Arbitrum blockchain to the Stellar network**, allowing users to convert USDC on Arbitrum into **cash via MoneyGram**.

## 🚀 What does it do?

It bridges **USDC tokens** from Arbitrum to Stellar using the [Allbridge Core](https://docs-core.allbridge.io) protocol. Once bridged, the funds are handled on Stellar and made available for **cash pickup at participating MoneyGram locations**, all without requiring the end-user to interact directly with the Stellar network.

## 🔄 How it works

1. The user submits a withdrawal request with the desired **USDC amount**.
2. The backend:
   - Approves the USDC to the Allbridge smart contract.
   - Calls `swapAndBridge` to transfer the funds from Arbitrum to Stellar.
3. On Stellar, the funds are routed through a custodial address that integrates with **MoneyGram Access**.
4. The user receives a pickup code and can withdraw the funds at a MoneyGram location.

## 📐 Architecture

For a detailed overview of the system architecture, check out the [Architecture Documentation](./ARCHITECTURE.md).


## 🌐 Tech Stack

- **Next.js (API Routes)** – for backend logic.
- **Viem** – Ethereum smart contract interaction.
- **Allbridge Core Protocol** – cross-chain bridging infrastructure.
- **MoneyGram Access API** – for the final cash withdrawal.

## 📦 Requirements

- Arbitrum RPC provider (Alchemy, Infura, Ankr, etc.).
- A wallet funded with **USDC and ETH for gas** on Arbitrum.
- Integration with a **custodial Stellar account** that supports MoneyGram offramps (handled server-side).

## 📌 Environment Variables

```env
RPC_URL=https://arb-mainnet.g.alchemy.com/v2/...
PRIVATE_KEY=0x...
USDC_ADDRESS=0x... # USDC token on Arbitrum
ALLBRIDGE_CONTRACT=0x9Ce3447B58D58e8602B7306316A5fF011B92d189
```


-------------------------------------------------------------------------------



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

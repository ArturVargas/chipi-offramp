"use client";

import { ChipiProvider } from "@chipi-pay/chipi-sdk";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChipiProvider
      config={{
        apiPublicKey: "pk_prod_670b0255b3afa5590d0d938ce5f423ed",
      }}
    >
      {children}
    </ChipiProvider>
  );
}
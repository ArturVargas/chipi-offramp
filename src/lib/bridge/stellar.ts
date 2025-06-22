import { Keypair, TransactionBuilder, Networks, Operation, Asset, Horizon } from 'stellar-sdk';

const server = new Horizon.Server('https://horizon.stellar.org');
const sourceKeypair = Keypair.fromSecret(process.env.STELLAR_SECRET_KEY!);

export async function sendUSDCStellar(to: string, amount: string) {
  const account = await server.loadAccount(sourceKeypair.publicKey());
  const fee = await server.fetchBaseFee();

  const tx = new TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(Operation.payment({
      destination: to,
      asset: new Asset('USDC', process.env.STELLAR_USDC_ISSUER!),
      amount,
    }))
    .setTimeout(30)
    .build();

  tx.sign(sourceKeypair);
  return server.submitTransaction(tx);
}

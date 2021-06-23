import {
  findOrCreateAccountByMint,
  LENDING_PROGRAM_ID,
  notify, ParsedAccount,
  sendTransaction,
  TokenAccount
} from '@oyster/common';
import { AccountLayout } from '@solana/spl-token';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  withdrawObligationCollateralInstruction,
  refreshReserveInstruction,
  Reserve, refreshObligationInstruction, Obligation
} from '../models';

export const withdrawObligationCollateral = async (
  connection: Connection,
  wallet: any,
  collateralAmount: number,
  source: TokenAccount,
  reserve: Reserve,
  reserveAddress: PublicKey,
  obligation: ParsedAccount<Obligation>,
) => {
  notify({
    message: 'Withdrawing collateral...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
    [reserve.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID,
  );

  signers.push(wallet.info.account);

  // get destination account
  const destinationCollateral = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    reserve.collateral.mintPubkey,
    signers,
  );

  instructions.push(
    // @TODO: refresh all obligation reserves
    refreshReserveInstruction(
      reserveAddress,
      reserve.liquidity.oraclePubkey,
    ),
    refreshObligationInstruction(
      obligation.pubkey,
      obligation.info.deposits.map(collateral => collateral.depositReserve),
      obligation.info.borrows.map(liquidity => liquidity.borrowReserve),
    ),
    withdrawObligationCollateralInstruction(
      collateralAmount,
      reserve.collateral.supplyPubkey,
      destinationCollateral,
      reserveAddress,
      obligation.pubkey,
      reserve.lendingMarket,
      lendingMarketAuthority,
      wallet.publicKey
    ),
  );

  try {
    let { txid } = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true,
    );

    notify({
      message: 'Collateral withdrawn.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch {
    // TODO:
  }
};
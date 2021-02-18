import * as Layout from '../utils/layout';
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { utils } from '@oyster/common';

export const DESC_SIZE = 200;
export const NAME_SIZE = 32;

export enum TimelockInstruction {
  InitTimelockSet = 1,
  AddSignatoryMint = 11,
  AddVotingMint = 12,
}

export interface TimelockConfig {
  consensusAlgorithm: ConsensusAlgorithm;
  executionType: ExecutionType;
  timelockType: TimelockType;
}

export enum ConsensusAlgorithm {
  Majority = 0,
  SuperMajority = 1,
  FullConsensus = 2,
}

export enum ExecutionType {
  AllOrNothing = 0,
  AnyAboveVoteFinishSlot = 1,
}

export enum TimelockType {
  CustomSingleSignerV1 = 0,
}

export enum TimelockStateStatus {
  /// Draft
  Draft = 0,
  /// Taking votes
  Voting = 1,

  /// Votes complete, in execution phase
  Executing = 2,

  /// Completed, can be rebooted
  Completed = 3,

  /// Deleted
  Deleted = 4,
}

export interface TimelockState {
  status: TimelockStateStatus;
  totalVotingTokensMinted: BN;
  timelockTransactions: PublicKey[];
  name: string;
  descLink: string;
}

export const TimelockSetLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),
    Layout.publicKey('signatoryMint'),
    Layout.publicKey('adminMint'),
    Layout.publicKey('votingMint'),
    Layout.publicKey('signatoryValidation'),
    Layout.publicKey('adminValidation'),
    Layout.publicKey('votingValidation'),
    BufferLayout.u8('timelockStateStatus'),
    Layout.uint64('totalVotingTokensMinted'),
    BufferLayout.seq(BufferLayout.u8(), DESC_SIZE, 'descLink'),
    BufferLayout.seq(BufferLayout.u8(), NAME_SIZE, 'name'),
    Layout.publicKey('timelockTxn1'),
    Layout.publicKey('timelockTxn2'),
    Layout.publicKey('timelockTxn3'),
    Layout.publicKey('timelockTxn4'),
    Layout.publicKey('timelockTxn5'),
    Layout.publicKey('timelockTxn6'),
    Layout.publicKey('timelockTxn7'),
    Layout.publicKey('timelockTxn8'),
    Layout.publicKey('timelockTxn9'),
    Layout.publicKey('timelockTxn10'),
    BufferLayout.u8('consensusAlgorithm'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('timelockType'),
  ],
);

export interface TimelockSet {
  /// Version of the struct
  version: number;

  /// Mint that creates signatory tokens of this instruction
  /// If there are outstanding signatory tokens, then cannot leave draft state. Signatories must burn tokens (ie agree
  /// to move instruction to voting state) and bring mint to net 0 tokens outstanding. Each signatory gets 1 (serves as flag)
  signatoryMint: PublicKey;

  /// Admin ownership mint. One token is minted, can be used to grant admin status to a new person.
  adminMint: PublicKey;

  /// Mint that creates voting tokens of this instruction
  votingMint: PublicKey;

  /// Used to validate signatory tokens in a round trip transfer
  signatoryValidation: PublicKey;

  /// Used to validate admin tokens in a round trip transfer
  adminValidation: PublicKey;

  /// Used to validate voting tokens in a round trip transfer
  votingValidation: PublicKey;

  /// Reserve state
  state: TimelockState;

  /// configuration values
  config: TimelockConfig;
}

export const TimelockSetParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = TimelockSetLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      version: data.version,
      signatoryMint: data.signatoryMint,
      adminMint: data.adminMint,
      votingMint: data.votingMint,
      signatoryValidation: data.signatoryValidation,
      adminValidation: data.adminValidation,
      votingValidation: data.votingValidation,
      state: {
        status: TimelockStateStatus[data.timelockStateStatus],
        totalVotingTokensMinted: data.totalVotingTokensMinted,
        descLink: utils.fromUTF8Array(data.descLink),
        name: utils.fromUTF8Array(data.name),
        timelockTransactions: [
          data.timelockTxn1,
          data.timelockTxn2,
          data.timelockTxn3,
          data.timelockTxn4,
          data.timelockTxn5,
          data.timelockTxn6,
          data.timelockTxn7,
          data.timelockTxn8,
          data.timelockTxn9,
          data.timelockTxn10,
        ],
      },
      config: {
        consensusAlgorithm: data.consensusAlgorithm,
        executionType: data.executionType,
        timelockType: data.timelockType,
      },
    },
  };

  return details;
};

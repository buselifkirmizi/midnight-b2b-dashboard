import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { Ledger } from "../managed/contract/index.js";

export type AgreementPrivateState = {
  readonly clientName: Uint8Array;
  readonly paymentAmount: bigint;
  readonly projectScope: Uint8Array;
};

export const createAgreementPrivateState = (): AgreementPrivateState => ({
  clientName: new Uint8Array(32),
  paymentAmount: 0n,
  projectScope: new Uint8Array(64),
});

export const witnesses = {
  clientName: ({ privateState }: WitnessContext<Ledger, AgreementPrivateState>): [AgreementPrivateState, Uint8Array] => [privateState, privateState.clientName],
  paymentAmount: ({ privateState }: WitnessContext<Ledger, AgreementPrivateState>): [AgreementPrivateState, bigint] => [privateState, privateState.paymentAmount],
  projectScope: ({ privateState }: WitnessContext<Ledger, AgreementPrivateState>): [AgreementPrivateState, Uint8Array] => [privateState, privateState.projectScope],
};

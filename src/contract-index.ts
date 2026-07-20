import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
export * from "../managed/contract/index.js";
export * from "./witnesses.js";
import * as CompiledAgreement from "../managed/contract/index.js";
import * as Witnesses from "./witnesses.js";

export const CompiledAgreementContract = CompiledContract.make<CompiledAgreement.Contract<Witnesses.AgreementPrivateState>>("Agreement", CompiledAgreement.Contract<Witnesses.AgreementPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets("./managed"),
);

import { describe, it, expect } from "vitest";
import { Contract, ledger } from "../managed/contract/index.js";
import { createConstructorContext, createCircuitContext, sampleContractAddress } from "@midnight-ntwrk/compact-runtime";

describe("Agreement contract", () => {
  it("initializes with zero agreement count", () => {
    const contract = new Contract({});
    const { currentContractState } = contract.initialState(
      createConstructorContext({}, "0".repeat(64))
    );
    const state = ledger(currentContractState.data);
    expect(state.agreementCount).toEqual(0n);
  });

  it("increments agreement count after createAgreement", () => {
    const contract = new Contract({});
    const initResult = contract.initialState(
      createConstructorContext({}, "0".repeat(64))
    );
    const address = sampleContractAddress();
    const circuitContext = createCircuitContext(
      address,
      "0".repeat(64),
      initResult.currentContractState,
      {}
    );
    const partyA = new Uint8Array(32);
    const partyB = new Uint8Array(32);
    const { context } = contract.impureCircuits.createAgreement(
      circuitContext,
      partyA,
      partyB,
      1000n
    );
    const state = ledger(context.currentQueryContext.state);
    expect(state.agreementCount).toEqual(1n);
  });
});

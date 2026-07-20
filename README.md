# Midnight B2B Dashboard

A privacy-first B2B client agreement management dashboard built on the Midnight Network using the Compact smart contract language.

## Project Idea

This project aims to build a decentralized B2B dashboard for freelancers and agencies to manage client agreements securely. While the existence of a contract and its timestamp is public on the ledger, sensitive details like client names, payment amounts, and project scopes remain completely hidden using Midnight's privacy-first architecture.

## Public State vs. Private Witness

Midnight's Compact language allows developers to choose exactly what is exposed on-chain and what stays private.

**Public State (on-chain ledger):**
- `contractId`: A unique identifier for the agreement.
- `partyA`, `partyB`: The wallet addresses of the involved parties.
- `agreementTimestamp`: When the agreement was created.
- `agreementCount`: A counter tracking how many agreements have been created.

**Private Witness (never leaves the client):**
- `clientName`: The actual identity of the client.
- `paymentAmount`: The financial amount agreed on.
- `projectScope`: The details of the work covered by the agreement.

The `disclose()` function is used deliberately in the contract to indicate which circuit inputs the developer considers safe to move into public state. Witnesses never touch the ledger, ensuring competitive and sensitive business data stays confidential while the existence and validity of agreements remain verifiable.

## Project Structure

midnight-b2b-dashboard/
├── agreement.compact       # The Compact smart contract
├── managed/                # Compiled circuits, keys, and TypeScript API
│   ├── compiler/
│   ├── contract/
│   ├── keys/
│   └── zkir/
├── test/
│   └── agreement.test.ts   # Vitest test suite
├── package.json
├── tsconfig.json
└── README.md
## Prerequisites

- Windows with WSL2 + Ubuntu, macOS, or Linux
- Docker Desktop (running)
- Node.js 22 (via `nvm` inside WSL/Linux)
- Compact developer tools

## Setup

### 1. Install the Compact toolchain (inside WSL/Linux)

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
source $HOME/.local/bin/env
compact update
```

Verify:

```bash
compact --version
compact compile --help
```

### 2. Clone the repository

```bash
git clone https://github.com/buselifkirmizi/midnight-b2b-dashboard.git
cd midnight-b2b-dashboard
```

### 3. Install Node dependencies

```bash
npm install
```

### 4. Compile the contract

```bash
compact compile agreement.compact managed
```

This produces the `managed/` directory containing the compiled circuits, proving/verifying keys, and TypeScript API.

### 5. Run the test suite

```bash
npm test
```

Expected output: two tests pass, verifying that:
- The ledger initializes with an agreement count of zero.
- Calling `createAgreement` increments the count to one.

## Deployment

The contract has been successfully deployed to the Midnight **Preview** network.

- **Network:** Preview
- **Contract address:** `2756ccf6c0aa587f81b27ec8e077955e8a8034317657f4f951c00feb6eade355`
- **Transaction hash:** `537aaccf021e0e05aa49dd290efd73d73509d2fb09d98c2bfab352e0cc8ec543`
- **Deployed at:** 2026-07-20T09:08:58.525Z

Full deployment metadata is available in [`deployment.json`](./deployment.json).

### Deployment requirements

- A running proof server (Docker):
```bash
docker run -p 6300:6300 midnightnetwork/proof-server midnight-proof-server
```
- A funded Midnight wallet (Preview or Preprod), obtained via the [Nethermind faucet](https://midnight-tmnight-preview.nethermind.dev/) or the [official Midnight faucet](https://faucet.preview.midnight.network).
- A deployment script wiring up the Midnight indexer, node, and proof server providers (see `src/`).

### Public state vs. private witness

The contract's ledger fields (`contractId`, `partyA`, `partyB`, `agreementTimestamp`, `agreementCount`) are all public: every write to them is visible on-chain to anyone querying the indexer. In Compact, circuit inputs are private by default; `disclose()` does not itself make a value public, it tells the compiler the developer considers that specific value safe to expose. Data only becomes genuinely public once it crosses into a public domain, such as a ledger write, a return value from an exported circuit, or a contract-to-contract call. In this contract, `createAgreement` explicitly discloses its three parameters (`a`, `b`, `timestamp`) before writing them into the public ledger state; the witness functions (`clientName`, `paymentAmount`, `projectScope`) remain declared as private inputs and are never disclosed, keeping that data off-chain.

## License

ISC

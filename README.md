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

Deployment to the Midnight Preprod network requires:
- A running proof server (Docker):
```bash
  docker run -p 6300:6300 midnightnetwork/proof-server midnight-proof-server
```
- A Lace wallet configured for Midnight Preprod, funded via the [Midnight test faucet](https://faucet.preprod.midnight.network).
- A deployment script wiring up the Midnight indexer, node, and proof server providers.

Deployment work is ongoing; see the repository commit history for the current progress.

## License

ISC

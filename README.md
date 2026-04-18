# CTO (CKB Time Oracle)

A decentralized, high-concurrency time oracle for CKB.

## Background

On CKB, smart contracts can verify block timestamps using `header_deps`. However, they cannot natively determine if a provided header is "fresh" or years old.

This project solves this by maintaining a rotating group of on-chain cells updated with the latest block timestamps. By referencing these cells, other contracts can ensure they are using reliable, near-real-time data without needing complex header parsing or trusting a single centralized provider.

## Quick Start

### 1. Query Oracle State

Check the current timestamps and rotation status of an oracle group.

```bash
cd supplier
pnpm run start query -a <ARGS>
```

**Expected Output:**

```text
Args: 0x...80. Group Size: 3.

- #0 1776461097099 in 0x...5b#0
- #1 1776461142156 in 0x...80#0
- #2 1776461176556 in 0x...15#0
```

### 2. Supply Timestamps

Start a service to periodically update the oldest cell in the group with the latest block time.

```bash
pnpm run start supply -a <ARGS> --pk <PRIVATE_KEY>
```

**Expected Output:**

```text
2024-04-18T10:00:00.000Z | [Update] Group Size: 3 (1713421200000 - 1713421320000), Args: 0x... Updated to 1713421380000. Transaction Hash: 0x...
```

### 3. Create New Oracle

Initialize a new oracle group with a specific size.

```bash
pnpm run start create -s 3 --pk <PRIVATE_KEY>
```

---

## Architecture in Brief

- **Multi-Cell Rotation**: Uses multiple cells to distribute read/write pressure and increase concurrency.
- **Permissionless**: Updates are proven by block headers and can be performed by any participant.
- **Secure**: The contract enforces lock continuity to prevent hijacking or restricted access.

For detailed logic and specifications, see:

- [Contract Design](docs/00-contract-design.md)
- [Supplier Design](docs/01-supplier-design.md)

## Development

- **Build Contract**: `cd contracts && make build`
- **Run Tests**: `cd contracts/tests && cargo test`

## License

MIT

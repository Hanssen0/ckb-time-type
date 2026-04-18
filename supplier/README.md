# CTO (CKB Time Oracle) Supplier

The Supplier is a command-line tool and service used to interact with and maintain CTO cell groups.

## Design

For a detailed explanation of the supplier's behavior and conflict resolution strategy, please refer to:

- **[Supplier Design Specification](../docs/01-supplier-design.md)**

## Usage

### Installation

```bash
pnpm install
```

### Commands

#### Query

Check the current status and timestamps of an oracle group.

```bash
pnpm run start query -a <ARGS>
```

#### Supply

Run the supplier service to periodically update the oldest cell in a group.

```bash
pnpm run start supply -a <ARGS> --pk <PRIVATE_KEY>
```

#### Create

Initialize a new oracle group.

```bash
pnpm run start create -s <SIZE> --pk <PRIVATE_KEY>
```

### Network Configuration

By default, the tool connects to the CKB Testnet.

- Use `-m` or `--mainnet` for Mainnet.
- Use `-r` or `--rpc-url` to specify a custom CKB node RPC URL.

## Development

```bash
pnpm run build
```

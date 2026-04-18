# ckb-cto (CTO Supplier CLI)

**ckb-cto** is the command-line tool for maintaining **CTO (CKB Time Oracle)** cell groups. It provides commands to initialize oracle groups, supply them with current timestamps, and query their status.

For technical details and architecture design, please refer to the [main documentation](https://github.com/Hanssen0/ckb-cto).

## Installation

```bash
# Install globally
npm install -g @ckb-cto/supplier
ckb-cto -h

# Or run directly
npx @ckb-cto/supplier --help
```

## Core Commands

### 1. `create`
Initialize a new group of $N$ oracle cells.

```bash
ckb-cto create --size 5 --pk <YOUR_PRIVATE_KEY>
```
- `--size`: Number of cells in the rotation group (default: 5).
- Returns the `Type ID Args` used to identify your oracle.

### 2. `supply`
Start the automated maintenance service to update oracle timestamps.

```bash
ckb-cto supply --args <ORACLE_ARGS> --pk <YOUR_PRIVATE_KEY> --interval 30
```
- `--args`: The Type ID Args of the oracle group(s).
- `--interval`: Minimum seconds between updates (default: 30).
- `--mainnet`: Use CKB Mainnet (default: Testnet).

### 3. `query`
Inspect the status of existing oracle groups.

```bash
ckb-cto query --args <ORACLE_ARGS>
```

## Options

| Flag | Description |
| --- | --- |
| `--pk` | Private key for signing transactions. |
| `--args` | Type script args of the oracle group. |
| `--rpc-url` | Custom CKB node RPC URL. |
| `--code-hash` | Custom code hash for the CTO script (Advanced). |
| `--tx-hash` | Custom transaction hash for the CTO cell dep (Advanced). |

## License
MIT

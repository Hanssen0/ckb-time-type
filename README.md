# CTO (CKB Time Oracle)

[![NPM Version](https://img.shields.io/npm/v/@ckb-cto/supplier?label=CLI)](https://www.npmjs.com/package/@ckb-cto/supplier)
[![NPM Version](https://img.shields.io/npm/v/@ckb-cto/lib?label=SDK)](https://www.npmjs.com/package/@ckb-cto/lib)

A decentralized, high-concurrency time oracle for CKB. It provides a verifiable, monotonic-increasing time source on-chain by maintaining a rotating group of cells.

## Live Dashboard
The live dashboard is available at [ckb-cto.hanssen0.com](https://ckb-cto.hanssen0.com).

[![Dashboard](https://raw.githubusercontent.com/Hanssen0/ckb-cto/refs/heads/main/docs/dashboard.png)](https://ckb-cto.hanssen0.com)

## Packages

### CLI (@ckb-cto/supplier)
Command-line tool to initialize, maintain, and query oracle groups.
- **create**: Initialize a new group of oracle cells.
- **supply**: Automatically update oracle timestamps at regular intervals.
- **query**: Inspect the status and history of oracle groups.

For detailed command usage, see the [CLI README](./supplier/README.md).

```bash
# Maintain an oracle group by automatically updating its timestamp
npx @ckb-cto/supplier supply --args <ORACLE_ARGS> --pk <PRIVATE_KEY>
```

### SDK (@ckb-cto/lib)
TypeScript library to interact with CTO cells in your applications.
```bash
npm install @ckb-cto/lib
```

For detailed command usage, see the [SDK README](./lib/README.md).

## Project Structure
- `contracts/`: Core Rust scripts for the time oracle logic.
- `supplier/`: CLI tool source code.
- `lib/`: TypeScript SDK source code.
- `dashboard/`: Web monitoring dashboard source code.
- `docs/`: Technical specifications and design documents.

## Documentation
- [Technical Proposal](./docs/00-contract-design.md)
- [Supplier Design](./docs/01-supplier-design.md)

## License
MIT

<p align="center">
  <a href="https://ckb-cto.hanssen0.com/">
    <img alt="Logo" src="https://raw.githubusercontent.com/Hanssen0/ckb-cto/main/docs/logo.svg" style="height: 8rem; max-width: 90%; padding: 0.5rem 0;" />
  </a>
</p>

<h1 align="center" style="font-size: 64px;">
  CTO
</h1>

[![NPM Version](https://img.shields.io/npm/v/@ckb-cto/supplier?label=CLI)](https://www.npmjs.com/package/@ckb-cto/supplier)
[![NPM Version](https://img.shields.io/npm/v/@ckb-cto/lib?label=SDK)](https://www.npmjs.com/package/@ckb-cto/lib)

CTO is CKB Time Oracle. A decentralized, high-concurrency time oracle for CKB. It provides a verifiable, monotonic-increasing time source on-chain by maintaining a rotating group of cells.

### Why CTO?

On CKB, scripts are "time-blind" beyond the static timestamps in `header_deps`. While a script can read a block's time, it has no native way to verify if that block is recent or a years-old record provided by an attacker. CTO solves this by maintaining a rotating group of cells that store authenticated, ever-advancing timestamps.

---

- [Live Dashboard](#live-dashboard)
- [Packages](#packages)
  - [CLI (@ckb-cto/supplier)](#cli-ckb-ctosupplier)
  - [SDK (@ckb-cto/lib)](#sdk-ckb-ctolib)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

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

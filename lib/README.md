# @ckb-cto/lib

A decentralized, high-concurrency time oracle SDK for CKB. This library provides the necessary tools to interact with CKB Time Oracle (CTO) cells, including querying, discovering, and maintaining oracle groups.

## Installation

```bash
npm install @ckb-cto/lib
# or
pnpm add @ckb-cto/lib
```

## Features

- **Query Time Cells**: Retrieve and sort oracle cells within a specific group.
- **Discover Groups**: Find all active time oracle groups on the network.
- **Maintenance**: Utilities for creating and supplying time to oracle groups.

## Quick Start

### Find Time Cells

```typescript
import { ccc } from "@ckb-ccc/ccc";
import { findTimeCells } from "@ckb-cto/lib";

const client = new ccc.ClientPublicTestnet();
const groupArgs = "0x..."; // Your oracle type script args

const group = await findTimeCells(client, groupArgs);
console.log(`Latest timestamp: ${ccc.numFromBytes(group.cells[0].outputData)}`);
```

### Discover Active Groups

```typescript
import { ccc } from "@ckb-ccc/ccc";
import { discoverTimeCellGroups } from "@ckb-cto/lib";

const client = new ccc.ClientPublicTestnet();

for await (const group of discoverTimeCellGroups(client)) {
  console.log(`Group: ${group.args}, Latest Time: ${group.latestTimestamp}`);
}
```

## Documentation

For full API documentation, run:

```bash
pnpm docs
```

## License

MIT

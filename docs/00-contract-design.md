# CKB Time Oracle Technical Proposal

## 1. Design Background and Goals

**Background**: CKB scripts can only verify time using `header_deps`. However, scripts cannot verify if a provided header is outdated; a sender could use a very old block header, and the script would have no way to detect its staleness.

**Solution**: This proposal maintains a group of cells that are continuously updated with recent block timestamps. By referencing these cells, other contracts can ensure the time data they use is reasonably fresh and hasn't deviated significantly from the current network time.

**Goals**:

- **Decentralization**: Timestamps are derived from CKB block headers; the update process is entirely permissionless.
- **Hotspot Mitigation**: A multi-cell rotation model distributes read/write pressure, reducing concurrency conflicts.

## 2. Data Structure

### 2.1 Type Script Args (33 bytes)

- `type_id` (32 bytes): A unique identifier for the instance, based on the [Type ID](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0022-transaction-structure/0022-transaction-structure.md#type-id) protocol.
- `N` (1 byte, u8): The total number of cells in the group.

### 2.2 Cell Data (8 bytes)

- `timestamp` (8 bytes, Uint64): A Unix timestamp in milliseconds (little-endian).

## 3. Validation Logic

### 3.1 Creation

Triggered when the Type Script is absent from the transaction inputs but present in the outputs:

1. **Uniqueness**: The transaction must comply with the Type ID protocol. To ensure all `N` cells in a group have identical `args`, the `type_id` is calculated as follows:
   - The calculation follows the standard Type ID rule: `hash(tx.inputs[0], output_index)`.
   - The `output_index` must be the index of the first cell of the group in the current transaction's outputs, which allows multiple oracle groups (each with a different starting `output_index`) to be created in a single transaction.
2. **Initialization**:
   - The number of output cells with the same `type_id` must be exactly equal to `N` as specified in `args`.
   - For every output cell, its `timestamp` must be exactly equal to the timestamp of a block header in the transaction's `header_deps`. While all cells in the group aren't strictly required to use the same header, each cell's timestamp must be proven by a corresponding header.

### 3.2 Update

Triggered when a transaction modifies the state of a cell:

1. **Input/Output Constraints**:
   - **Inputs**: Must contain exactly one old cell of this type; read its `old_timestamp`.
   - **Outputs**: Must contain exactly one corresponding updated cell; write its `new_timestamp`.
   - **Cell Deps**: Must contain all other `N - 1` cells in the group; read their timestamps as the set `deps_timestamps`.
   - **Lock Script Continuity**: The `lock` script hash of the output cell must be identical to the `lock` script hash of the input cell. This prevents an attacker from changing the lock script (which is typically "always success" to allow permissionless updates) to a restricted one, which would effectively "hijack" the cell and stop the oracle's rotation.
2. **Round-robin Rotation**:
   - **Oldest Verification**: `old_timestamp` must be less than or equal to every value in `deps_timestamps`.
   - **Newest Verification**: `new_timestamp` must be strictly greater than `old_timestamp` AND strictly greater than every value in `deps_timestamps`.
3. **Header timestamp Proof**: `new_timestamp` must be exactly equal to the timestamp of one of the block headers in the transaction's `header_deps`.

## 4. Design Features

- **High Concurrency**: Consumers can select any cell from the group. Since updates rotate through the `N` cells, read/write conflicts on a single cell are significantly reduced.
- **Deterministic Sequencing**: The "oldest-to-newest" requirement ensures the group forms an ordered cycle, preventing time regression.
- **Ease of Integration**: Consumer contracts can obtain reliable time by simply reading the referenced oracle cell, without needing to parse block headers themselves.

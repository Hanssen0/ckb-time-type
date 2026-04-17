# CKB Time Oracle Supplier Design

The Supplier is an off-chain service responsible for maintaining the freshness of the CKB Time Oracle by periodically updating the oracle cells.

## 1. Core Workflow

To ensure the oracle group remains updated, the Supplier follows the validation logic defined in the contract:

1. **State Synchronization**: Periodically query all `N` cells associated with a specific `type_id`.
2. **Oldest Cell Identification**: Identify the cell with the smallest `timestamp` (`old_timestamp`) among the group to serve as the transaction input.
3. **Transaction Construction**:
   - **Inputs**: Use the identified oldest cell.
   - **Outputs**: Create a corresponding cell with a `new_timestamp` derived from the latest block header.
   - **Cell Deps**: Include the remaining `N - 1` cells from the group to satisfy the contract's rotation proof.
   - **Header Deps**: Include the block header corresponding to the `new_timestamp`.
   - **Lock Continuity**: Maintain the exact same `lock` script for the output cell as the input cell.
4. **Execution**: Submit the transaction to the CKB network.

## 2. Operational Strategies

### Conflict Resolution
Since the update process is permissionless and multiple Suppliers may target the same oldest cell simultaneously:
- **Natural Competition**: The Supplier treats transaction conflicts (e.g., double-spend or RBF rejections) as normal behavior. 
- **Stateless Retries**: If a transaction fails due to a conflict, the Supplier simply waits for the next interval to re-synchronize the state and identify the next oldest cell. This ensures the system remains decentralized and robust without requiring complex coordination.

### Redundancy and Availability
- **High Availability**: Multiple independent Suppliers provide natural redundancy. Even if some Suppliers go offline, the oracle continues to rotate as long as at least one Supplier remains active.
- **Permissionless Updates**: By using an "always success" lock and enforcing lock continuity in the contract, the rotation process remains open to any participant, preventing any single entity from hijacking the oracle.

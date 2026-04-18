import { ccc } from "@ckb-ccc/ccc";

/**
 * Options for identifying a CKB script (e.g., the oracle type script).
 */
export interface ScriptOptionsLike {
  /** The code hash of the script. Defaults to the one in constants.ts. */
  codeHash?: ccc.HexLike;
  /** The hash type of the script. Defaults to the one in constants.ts. */
  hashType?: ccc.HashTypeLike;
}

/**
 * Options for identifying a CKB cell dep (e.g., the oracle type script cell dep).
 */
export interface CellDepOptionsLike {
  /** The transaction hash of the cell dep. Defaults to the one in constants.ts. */
  txHash?: ccc.HexLike;
  /** The index of the cell dep in the transaction. Defaults to the one in constants.ts. */
  index?: ccc.NumLike;
}

/**
 * Combined options for scripts and cell deps.
 */
export type OptionsLike = ScriptOptionsLike & CellDepOptionsLike;

/**
 * Basic information about a discovered time oracle group.
 */
export interface TimeCellGroupInfo {
  /** The type script args identifying the group. */
  args: string;
  /** The number of cells (N) defined for this group. */
  n: number;
  /** The latest timestamp (in ms) recorded in this group. */
  latestTimestamp: bigint;
}

/**
 * Detailed representation of a time oracle group's cells.
 */
export interface TimeCellGroup {
  /** The list of cells belonging to the group, typically sorted newest first. */
  cells: ccc.Cell[];
  /** The expected number of cells (N) in the group. */
  n: number;
}

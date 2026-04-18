import { ccc } from "@ckb-ccc/ccc";

export interface ScriptOptionsLike {
  codeHash?: ccc.HexLike;
  hashType?: ccc.HashTypeLike;
}

export interface CellDepOptionsLike {
  txHash?: ccc.HexLike;
  index?: ccc.NumLike;
}

export type OptionsLike = ScriptOptionsLike & CellDepOptionsLike;

export interface TimeCellGroupInfo {
  args: string;
  n: number;
  latestTimestamp: bigint;
}

export interface TimeCellGroup {
  cells: ccc.Cell[];
  n: number;
}

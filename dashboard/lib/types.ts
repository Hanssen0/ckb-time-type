import { ccc } from "@ckb-ccc/ccc";

export interface TimeCellGroup {
  args: string;
  n: number;
  count: number;
  latestTimestamp: bigint;
}

export interface QueryResult {
  cells: ccc.Cell[];
  n: number;
}

export interface OperationLog {
  time: string;
  type: "info" | "error" | "success";
  msg: string;
  txHash?: string;
  prefix?: string;
  suffix?: string;
}

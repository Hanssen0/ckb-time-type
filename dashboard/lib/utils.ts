import { ccc } from "@ckb-ccc/ccc";
import { getNetworkConfig } from "@ckb-time-type/lib";

export interface OperationLog {
  time: string;
  type: "info" | "error" | "success";
  msg: string;
  txHash?: string;
  prefix?: string;
  suffix?: string;
}

export function getExplorerTxUrl(client: ccc.Client, txHash: string): string {
  const config = getNetworkConfig(client);
  return `${config.explorerUrl}/transaction/${txHash}`;
}

export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp)).toLocaleString();
}

export function truncateHex(hex: string, start = 6, end = 4): string {
  if (hex.length <= start + end + 2) return hex;
  return `${hex.slice(0, start)}...${hex.slice(-end)}`;
}

export function getInactivityTime(timestamp: bigint, now?: number): string {
  const diffMs = (now ?? Date.now()) - Number(timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ${diffSec % 60}s`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ${diffMin % 60}m`;
  return formatTimestamp(timestamp).split(",")[0];
}

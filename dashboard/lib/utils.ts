import { ccc } from "@ckb-ccc/ccc";
import { getNetworkConfig } from "./constants";
import { QueryResult, TimeCellGroup } from "./types";

export async function findTimeCells(
  client: ccc.Client,
  argsLike: ccc.HexLike,
  options: {
    codeHash?: ccc.HexLike;
    hashType?: ccc.HashTypeLike;
  } = {},
): Promise<QueryResult> {
  const config = getNetworkConfig(client);
  const args = ccc.bytesFrom(argsLike);
  if (args.length < 33) {
    throw Error("Invalid args length");
  }
  const n = args[32];
  const type = ccc.Script.from({
    codeHash: options.codeHash ?? config.codeHash,
    hashType: options.hashType ?? config.hashType,
    args,
  });

  const cells = [];
  for await (const cell of client.findCellsByType(type, true)) {
    cells.push(cell);
  }

  // Newest first
  cells.sort((a, b) => {
    const timeA = ccc.numFromBytes(a.outputData);
    const timeB = ccc.numFromBytes(b.outputData);
    const diff = timeB - timeA;
    return diff > 0n ? 1 : diff === 0n ? 0 : -1;
  });

  return {
    cells,
    n,
  };
}

export async function discoverTimeCellGroups(
  client: ccc.Client,
): Promise<TimeCellGroup[]> {
  const config = getNetworkConfig(client);
  const newGroups: Record<
    string,
    { n: number; count: number; latestTimestamp: bigint }
  > = {};

  for await (const cell of client.findCells({
    script: {
      codeHash: config.codeHash,
      hashType: config.hashType,
      args: "0x",
    },
    scriptType: "type",
    scriptSearchMode: "prefix",
    withData: true,
  })) {
    const args = cell.cellOutput.type?.args;
    if (!args) continue;

    const argsBytes = ccc.bytesFrom(args);
    if (argsBytes.length < 33) continue;

    const n = argsBytes[32];
    const timestamp = ccc.numFromBytes(cell.outputData);

    if (!newGroups[args]) {
      newGroups[args] = { n, count: 0, latestTimestamp: 0n };
    }
    newGroups[args].count += 1;
    if (timestamp > newGroups[args].latestTimestamp) {
      newGroups[args].latestTimestamp = timestamp;
    }
  }

  return Object.entries(newGroups)
    .map(([args, info]) => ({ args, ...info }))
    .sort((a, b) => {
      const diff = b.latestTimestamp - a.latestTimestamp;
      return diff > 0n ? 1 : diff === 0n ? 0 : -1;
    });
}

export async function supplyTime(
  signer: ccc.Signer,
  args: ccc.HexLike,
  options: {
    txHash?: ccc.HexLike;
    index?: ccc.NumLike;
    codeHash?: ccc.HexLike;
    hashType?: ccc.HashTypeLike;
  } = {},
) {
  const config = getNetworkConfig(signer.client);
  const { cells } = await findTimeCells(signer.client, args, options);
  if (cells.length === 0) {
    throw new Error("No cells found for the given args");
  }

  // cells are sorted descending (newest first)
  const oldestCell = cells[cells.length - 1];

  const header = await signer.client.getTipHeader();
  const { timestamp } = header;

  const tx = ccc.Transaction.from({
    cellDeps: [
      ...cells.slice(0, cells.length - 1).map((cell) => ({
        outPoint: cell.outPoint,
        depType: "code" as const,
      })),
      {
        outPoint: {
          txHash: options.txHash ?? config.cellDepTxHash,
          index: options.index ?? config.cellDepIndex,
        },
        depType: "code" as const,
      },
    ],
    headerDeps: [header.hash],
    inputs: [oldestCell],
    outputs: [oldestCell.cellOutput],
    outputsData: [ccc.numToBytes(timestamp, 8)],
  });

  await tx.addCellDepsOfKnownScripts(
    signer.client,
    ccc.KnownScript.AlwaysSuccess,
  );

  await tx.completeFeeBy(signer);
  return signer.sendTransaction(tx);
}

export async function createGroup(
  signer: ccc.Signer,
  size: number,
  options: {
    txHash?: ccc.HexLike;
    index?: ccc.NumLike;
    codeHash?: ccc.HexLike;
    hashType?: ccc.HashTypeLike;
  } = {},
): Promise<{ txHash: string; args: string }> {
  const { client } = signer;
  const config = getNetworkConfig(client);
  const header = await client.getTipHeader();
  const { timestamp } = header;

  const tx = ccc.Transaction.from({
    cellDeps: [
      {
        outPoint: {
          txHash: options.txHash ?? config.cellDepTxHash,
          index: options.index ?? config.cellDepIndex,
        },
        depType: "code",
      },
    ],
    headerDeps: [header.hash],
  });

  await tx.completeInputsAtLeastOne(signer);
  const args = ccc.bytesConcat(ccc.hashTypeId(tx.inputs[0], 0), [size]);
  const argsHex = ccc.hexFrom(args);

  const lock = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.AlwaysSuccess,
    "",
  );
  const type = ccc.Script.from({
    codeHash: options.codeHash ?? config.codeHash,
    hashType: options.hashType ?? config.hashType,
    args,
  });

  for (let i = 0; i < size; i += 1) {
    tx.addOutput({ lock, type }, ccc.numToBytes(timestamp, 8));
  }

  await tx.completeFeeBy(signer);
  const txHash = await signer.sendTransaction(tx);

  return { txHash, args: argsHex };
}

export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp)).toLocaleString();
}

export function truncateHex(hex: string, start = 6, end = 4): string {
  if (hex.length <= start + end + 2) return hex;
  return `${hex.slice(0, start)}...${hex.slice(-end)}`;
}

export function getInactivityTime(timestamp: bigint): string {
  const diffMs = Date.now() - Number(timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ${diffSec % 60}s`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ${diffMin % 60}m`;
  return formatTimestamp(timestamp).split(",")[0];
}

export function getExplorerTxUrl(client: ccc.Client, txHash: string): string {
  const config = getNetworkConfig(client);
  return `${config.explorerUrl}/transaction/${txHash}`;
}

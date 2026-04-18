import { ccc } from "@ckb-ccc/ccc";
import { resolveScript } from "./constants.js";
import {
  ScriptOptionsLike,
  TimeCellGroup,
  TimeCellGroupInfo,
} from "./types.js";

/**
 * Finds all time oracle cells belonging to a specific group defined by its type script args.
 *
 * @param client - The CKB client (e.g., ccc.ClientPublicTestnet).
 * @param argsLike - The hexadecimal string representing the type script args of the oracle group.
 * @param options - Optional script configuration (e.g., custom code hash or hash type).
 * @returns A promise that resolves to a {@link TimeCellGroup} containing the cells and group size.
 * @throws Error if the provided args are shorter than 33 bytes.
 */
export async function findTimeCells(
  client: ccc.Client,
  argsLike: ccc.HexLike,
  options: ScriptOptionsLike = {},
): Promise<TimeCellGroup> {
  const args = ccc.bytesFrom(argsLike);
  if (args.length < 33) {
    throw Error("Invalid args length");
  }
  const n = args[32];
  const type = ccc.Script.from({
    ...resolveScript(client, options),
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

/**
 * Discovers all active time oracle groups on the CKB network by scanning for cells
 * with the oracle type script.
 *
 * @param client - The CKB client to use for discovery.
 * @param options - Optional script configuration.
 * @yields An {@link TimeCellGroupInfo} for each complete group found.
 */
export async function* discoverTimeCellGroups(
  client: ccc.Client,
  options: ScriptOptionsLike = {},
): AsyncGenerator<TimeCellGroupInfo> {
  const groups: Record<string, TimeCellGroupInfo & { count: number }> = {};

  for await (const cell of client.findCells(
    {
      script: {
        ...resolveScript(client, options),
        args: "0x",
      },
      scriptType: "type",
      scriptSearchMode: "prefix",
      withData: true,
    },
    "desc",
  )) {
    const args = cell.cellOutput.type?.args;
    if (!args) continue;

    const argsBytes = ccc.bytesFrom(args);
    if (argsBytes.length < 33) continue;

    const n = argsBytes[32];
    const timestamp = ccc.numFromBytes(cell.outputData);

    if (!groups[args]) {
      groups[args] = { args, n, count: 1, latestTimestamp: timestamp };
    } else {
      groups[args].count += 1;
      if (timestamp > groups[args].latestTimestamp) {
        groups[args].latestTimestamp = timestamp;
      }
      if (groups[args].count === groups[args].n) {
        yield groups[args];
      }
    }
  }
}

import { ccc } from "@ckb-ccc/ccc";
import { resolveScript } from "./constants.js";
import {
  ScriptOptionsLike,
  TimeCellGroup,
  TimeCellGroupInfo,
} from "./types.js";

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

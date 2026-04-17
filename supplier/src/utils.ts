import { ccc } from "@ckb-ccc/shell";
import {
  CKB_TIME_TYPE_CODE_HASH,
  CKB_TIME_TYPE_HASH_TYPE,
} from "./constants.js";

export async function findTimeCells(
  client: ccc.Client,
  argsLike: ccc.HexLike,
  flags: {
    codeHash?: ccc.HexLike;
    hashType?: ccc.HashTypeLike;
  },
) {
  const args = ccc.bytesFrom(argsLike);
  const n = args[32];
  const type = ccc.Script.from({
    codeHash: flags.codeHash ?? CKB_TIME_TYPE_CODE_HASH,
    hashType: flags.hashType ?? CKB_TIME_TYPE_HASH_TYPE,
    args,
  });

  const cells = [];
  for await (const cell of client.findCellsByType(type, true)) {
    cells.push(cell);
  }
  if (cells.length !== n) {
    throw Error("Cells count and N are mismatched");
  }

  cells.sort((a, b) => {
    const diff =
      ccc.numFromBytes(a.outputData) - ccc.numFromBytes(b.outputData);
    return diff > 0n ? 1 : diff === 0n ? 0 : -1;
  });

  return {
    cells,
    n,
  };
}

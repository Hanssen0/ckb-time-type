import { ccc } from "@ckb-ccc/ccc";
import { findTimeCells } from "./cells.js";
import { resolveCellDep, resolveScript } from "./constants.js";
import { OptionsLike, TimeCellGroup } from "./types.js";

export async function supplyTime(
  signer: ccc.Signer,
  args: ccc.HexLike,
  txLike?: ccc.TransactionLike,
  options?: OptionsLike,
): Promise<
  {
    tx: ccc.Transaction;
    header: ccc.ClientBlockHeader;
  } & TimeCellGroup
> {
  const timeCellGroup = await findTimeCells(signer.client, args, options);
  const { cells, n } = timeCellGroup;
  if (cells.length !== n) {
    throw new Error(
      `Cells count mismatch. Expected ${n}, got ${cells.length}.`,
    );
  }

  // cells are sorted descending (newest first)
  // We update the oldest cell (the one at the end of the sorted array)
  const oldestCell = cells[cells.length - 1];

  const header = await signer.client.getTipHeader();
  const { timestamp } = header;

  const tx = txLike ? ccc.Transaction.from(txLike) : ccc.Transaction.default();
  tx.addCellDeps([
    // Other cells in the group used as cell deps to satisfy the script requirement
    ...cells.slice(0, cells.length - 1).map((cell) => ({
      outPoint: cell.outPoint,
      depType: "code",
    })),
    {
      outPoint: resolveCellDep(signer.client, options),
      depType: "code",
    },
  ]);
  tx.headerDeps.push(header.hash);
  tx.addInput(oldestCell);
  tx.addOutput(oldestCell.cellOutput, ccc.numToBytes(timestamp, 8));

  await tx.addCellDepsOfKnownScripts(
    signer.client,
    ccc.KnownScript.AlwaysSuccess,
  );

  return { tx, header, ...timeCellGroup };
}

export async function createGroup(
  signer: ccc.Signer,
  size: number,
  txLike?: ccc.TransactionLike,
  options?: OptionsLike,
): Promise<{
  tx: ccc.Transaction;
  args: string;
  header: ccc.ClientBlockHeader;
}> {
  const { client } = signer;
  const header = await client.getTipHeader();
  const { timestamp } = header;

  const tx = txLike ? ccc.Transaction.from(txLike) : ccc.Transaction.default();
  tx.addCellDeps([
    {
      outPoint: resolveCellDep(client, options),
      depType: "code",
    },
  ]);
  tx.headerDeps.push(header.hash);

  await tx.completeInputsAtLeastOne(signer);
  const args = ccc.hexFrom(
    ccc.bytesConcat(ccc.hashTypeId(tx.inputs[0], 0), [size]),
  );

  const lock = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.AlwaysSuccess,
    "",
  );
  const type = ccc.Script.from({
    ...resolveScript(client, options),
    args,
  });

  for (let i = 0; i < size; i += 1) {
    tx.addOutput({ lock, type }, ccc.numToBytes(timestamp, 8));
  }

  return { tx, args, header };
}

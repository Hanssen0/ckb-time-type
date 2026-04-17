import { ccc, numToBytes } from "@ckb-ccc/shell";

const CKB_TIME_TYPE_CELL_DEP_TX_HASH =
  "0x5f18a109df28869c494d004b965e153d94b824d223b7a19310754fa9d29196e2";
const CKB_TIME_TYPE_CELL_DEP_INDEX = 0;
const CKB_TIME_TYPE_CODE_HASH = ccc.hexFrom(
  "0xefee1785c7fbad43a398385f65d30948907f267eafb81003ab524ee21112546e",
);
const CKB_TIME_TYPE_HASH_TYPE = ccc.hashTypeFrom("data2");
const CKB_TIME_TYPE_ARGS = [
  "0x6b4be27e6ffc82cc8a7cf4cd7d671a4de80377ba18d3ea48ed06ef2de796591703",
];

const CKB_TIME_TYPE_CELL_DEP = ccc.CellDep.from({
  outPoint: {
    txHash: CKB_TIME_TYPE_CELL_DEP_TX_HASH,
    index: CKB_TIME_TYPE_CELL_DEP_INDEX,
  },
  depType: "code",
});
const CKB_TIME_TYPE = ccc.Script.from({
  codeHash: CKB_TIME_TYPE_CODE_HASH,
  hashType: CKB_TIME_TYPE_HASH_TYPE,
  args: "",
});

async function create(signer: ccc.Signer, n: number) {
  const header = await signer.client.getTipHeader();
  const { timestamp } = header;

  const tx = ccc.Transaction.from({
    cellDeps: [CKB_TIME_TYPE_CELL_DEP],
    headerDeps: [header.hash],
  });

  await tx.completeInputsAtLeastOne(signer);
  const args = ccc.bytesConcat(ccc.hashTypeId(tx.inputs[0], 0), [n]);

  const lock = await ccc.Script.fromKnownScript(
    signer.client,
    ccc.KnownScript.AlwaysSuccess,
    "",
  );
  const type = ccc.Script.from({
    ...CKB_TIME_TYPE,
    args,
  });

  for (let i = 0; i < n; i += 1) {
    tx.addOutput({ lock, type }, ccc.numToBytes(timestamp, 8));
  }

  console.log("Creating CKB Time Cells");
  console.log(`- Group Size: ${n}`);
  console.log(`- Code Hash: ${type.codeHash}`);
  console.log(`- Hash Type: ${type.hashType}`);
  console.log(`- Args: ${type.args}\n`);

  await tx.completeFeeBy(signer);
  const txHash = await signer.sendTransaction(tx);

  console.log(`Transaction Sent. Hash: ${txHash}\n`);
}

async function update(signer: ccc.Signer, argsLike: ccc.BytesLike) {
  const args = ccc.bytesFrom(argsLike);
  const n = args[32];
  const type = ccc.Script.from({
    ...CKB_TIME_TYPE,
    args,
  });

  const cells = [];
  for await (const cell of signer.client.findCellsByType(type, true)) {
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

  const header = await signer.client.getTipHeader();
  const { timestamp } = header;

  const tx = ccc.Transaction.from({
    cellDeps: [
      ...cells.slice(1).map((cell) => ({
        outPoint: cell.outPoint,
        depType: "code",
      })),
      CKB_TIME_TYPE_CELL_DEP,
    ],
    headerDeps: [header.hash],
    inputs: [cells[0]],
    outputs: [cells[0].cellOutput],
    outputsData: [numToBytes(timestamp, 8)],
  });

  const old_timestamp = ccc.numFromBytes(cells[0].outputData);
  const previous_timestamp = ccc.numFromBytes(
    cells[cells.length - 1].outputData,
  );

  await tx.completeFeeBy(signer);
  const txHash = await signer.sendTransaction(tx);

  console.log(
    `[Update] Group Size: ${n} (${old_timestamp} - ${previous_timestamp}), Args: ${ccc.hexFrom(
      args,
    )}. Timestamp Updated to ${timestamp}. Transaction Hash: ${txHash}`,
  );
}

async function main() {
  const client = new ccc.ClientPublicTestnet();
  const signer = new ccc.SignerCkbPrivateKey(
    client,
    "0xaff2f5d1087430d3692d2c884b5fcb1af8fa666a887e7190f425361974e33daf",
  );

  await update(signer, CKB_TIME_TYPE_ARGS[0]);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());

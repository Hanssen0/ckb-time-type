import { Command, Flags } from "@oclif/core";
import { ccc } from "@ckb-ccc/shell";
import {
  CKB_TIME_TYPE_CELL_DEP_TX_HASH,
  CKB_TIME_TYPE_CELL_DEP_INDEX,
  CKB_TIME_TYPE_CODE_HASH,
  CKB_TIME_TYPE_HASH_TYPE,
} from "../constants.js";

const HEX_PARSER = async (raw: string) => ccc.hexFrom(raw);

export default class Create extends Command {
  static override description = "create a ckb time cell group";
  static override examples = ["<%= config.bin %> <%= command.id %> -n 3 --pk 0x0000000000000000000000000000000000000000000000000000000000000000"];
  static override flags = {
    size: Flags.integer({
      char: "s",
      description: "cell group size",
      required: true,
    }),
    privateKey: Flags.string({
      helpLabel: "--pk, --private-key",
      aliases: ["private-key", "pk"],
      description: "private key of the supplier",
      parse: HEX_PARSER,
      required: true,
    }),
    mainnet: Flags.boolean({
      char: "m",
      description: "choose CKB mainnet",
      helpGroup: "network",
    }),
    rpcUrl: Flags.string({
      char: "r",
      helpLabel: "-r, --rpc-url",
      aliases: ["rpc-url"],
      description: "CKB node RPC url",
      helpGroup: "network",
    }),
    codeHash: Flags.string({
      helpLabel: "--code-hash",
      aliases: ["code-hash"],
      description: "code hash of the ckb time type script",
      helpGroup: "Custom Type Script (Advanced)",
      parse: HEX_PARSER,
    }),
    hashType: Flags.option({
      helpLabel: "--hash-type",
      aliases: ["hash-type"],
      description: "hash type of the ckb time type script",
      options: ["type", "data", "data1", "data2"],
      helpGroup: "Custom Type Script (Advanced)",
    })(),
    txHash: Flags.string({
      helpLabel: "--tx-hash",
      aliases: ["tx-hash"],
      description: "tx hash of the ckb time type script's cell dep",
      helpGroup: "Custom CellDep (Advanced)",
      parse: HEX_PARSER,
    }),
    index: Flags.integer({
      description: "index of the ckb time type script's cell dep",
      helpGroup: "Custom CellDep (Advanced)",
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    const client = flags.mainnet
      ? new ccc.ClientPublicMainnet({ url: flags.rpcUrl })
      : new ccc.ClientPublicTestnet({ url: flags.rpcUrl });
      
    const signer = new ccc.SignerCkbPrivateKey(client, flags.privateKey);

    await create(signer, flags.size, flags);
    process.exit(0);
  }
}

async function create(
  signer: ccc.Signer,
  n: number,
  flags: {
    txHash?: ccc.HexLike;
    index?: ccc.NumLike;
    codeHash?: ccc.HexLike;
    hashType?: ccc.HashTypeLike;
  },
) {
  const header = await signer.client.getTipHeader();
  const { timestamp } = header;

  const tx = ccc.Transaction.from({
    cellDeps: [
      {
        outPoint: {
          txHash: flags.txHash ?? CKB_TIME_TYPE_CELL_DEP_TX_HASH,
          index: flags.index ?? CKB_TIME_TYPE_CELL_DEP_INDEX,
        },
        depType: "code",
      },
    ],
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
    codeHash: flags.codeHash ?? CKB_TIME_TYPE_CODE_HASH,
    hashType: flags.hashType ?? CKB_TIME_TYPE_HASH_TYPE,
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

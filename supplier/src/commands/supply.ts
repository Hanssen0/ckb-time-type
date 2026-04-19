import { ccc } from "@ckb-ccc/shell";
import { supplyTime } from "@ckb-cto/lib";
import { Command, Flags } from "@oclif/core";

const HEX_PARSER = async (raw: string) => ccc.hexFrom(raw);

export default class Supply extends Command {
  static override description = "supply time for ckb time cell groups";
  static override examples = [
    "<%= config.bin %> <%= command.id %> -a 0x0000000000000000000000000000000000000000000000000000000000000000 --pk 0x0000000000000000000000000000000000000000000000000000000000000000",
  ];
  static override flags = {
    privateKey: Flags.string({
      helpLabel: "--pk, --private-key",
      aliases: ["private-key", "pk"],
      description: "private key of the supplier",
      parse: HEX_PARSER,
      required: true,
    }),
    args: Flags.string({
      char: "a",
      description: "args of the ckb time cell groups",
      multiple: true,
      parse: HEX_PARSER,
      required: true,
    }),
    interval: Flags.integer({
      char: "i",
      description: "interval (seconds) of update",
      default: 30,
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
    const { flags } = await this.parse(Supply);

    const client = flags.mainnet
      ? new ccc.ClientPublicMainnet({ url: flags.rpcUrl })
      : new ccc.ClientPublicTestnet({ url: flags.rpcUrl });

    const signer = new ccc.SignerCkbPrivateKey(client, flags.privateKey);

    while (true) {
      for (const arg of flags.args) {
        try {
          await update(this, signer, arg, flags);
          // Clear cache to avoid dirty data
          await signer.client.cache.clear();
        } catch (err) {
          this.warn(err as Error);
        }
      }

      await new Promise((resolve) =>
        setTimeout(resolve, flags.interval * 1000),
      );
    }
  }
}

async function update(
  logger: Command,
  signer: ccc.Signer,
  args: ccc.HexLike,
  flags: {
    txHash?: ccc.HexLike;
    index?: ccc.NumLike;
    codeHash?: ccc.HexLike;
    hashType?: ccc.HashTypeLike;
  },
) {
  const { tx, header, cells, n } = await supplyTime(signer, args, undefined, {
    codeHash: flags.codeHash,
    hashType: flags.hashType,
    txHash: flags.txHash,
    index: flags.index,
  });

  // SDK sorts descending (newest first)
  const newestTimestamp = ccc.numFromBytes(cells[0].outputData);
  const oldestTimestamp = ccc.numFromBytes(cells[cells.length - 1].outputData);

  try {
    await tx.completeFeeBy(signer);
    const txHash = await signer.sendTransaction(tx);
    logger.log(
      `${new Date().toISOString()} | [Update] Group Size: ${n} (${newestTimestamp} - ${oldestTimestamp}), Args: ${ccc.hexFrom(
        args,
      )}. Timestamp Updated to ${header.timestamp}. Transaction Hash: ${txHash}.`,
    );
  } catch (err) {
    if (err instanceof ccc.ErrorClientRBFRejected) {
      logger.log(
        `${new Date().toISOString()} | [Update] Group Size: ${n} (${newestTimestamp} - ${oldestTimestamp}), Args: ${ccc.hexFrom(
          args,
        )}. Updating by another supplier.`,
      );
    } else {
      throw err;
    }
  }
}

import { ccc } from "@ckb-ccc/shell";
import { findTimeCells } from "@ckb-cto/lib";
import { Command, Flags } from "@oclif/core";

const HEX_PARSER = async (raw: string) => ccc.hexFrom(raw);

export default class Query extends Command {
  static override description = "query timestamps from a ckb time cell group";
  static override examples = [
    "<%= config.bin %> <%= command.id %> -a 0x0000000000000000000000000000000000000000000000000000000000000000",
  ];
  static override flags = {
    args: Flags.string({
      char: "a",
      description: "args of the ckb time cell group",
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
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Query);

    const client = flags.mainnet
      ? new ccc.ClientPublicMainnet({ url: flags.rpcUrl })
      : new ccc.ClientPublicTestnet({ url: flags.rpcUrl });

    const { n, cells } = await findTimeCells(client, flags.args, flags);

    this.log(`Args: ${ccc.hexFrom(flags.args)}. Group Size: ${n}.\n`);

    cells.forEach((cell, index) => {
      const timestamp = ccc.numFromBytes(cell.outputData);
      const outPoint = `${cell.outPoint.txHash}#${cell.outPoint.index}`;
      this.log(
        `- #${index.toString().padEnd((cells.length - 1).toString().length)} ${timestamp.toString().padEnd(13)} in ${outPoint}`,
      );
    });

    process.exit(0);
  }
}

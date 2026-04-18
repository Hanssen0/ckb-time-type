import { Command, Flags } from "@oclif/core";
import { ccc } from "@ckb-ccc/shell";
import { createGroup } from "@ckb-cto/lib";

const HEX_PARSER = async (raw: string) => ccc.hexFrom(raw);

export default class Create extends Command {
  static override description = "create a ckb time cell group";
  static override examples = [
    "<%= config.bin %> <%= command.id %> -n 3 --pk 0x0000000000000000000000000000000000000000000000000000000000000000",
  ];
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

    this.log("Creating CKB Time Cells");
    this.log(`- Group Size: ${flags.size}`);

    const { tx, args } = await createGroup(
      signer,
      flags.size,
      undefined,
      flags,
    );

    await tx.completeFeeBy(signer);
    const txHash = await signer.sendTransaction(tx);

    this.log(`- Args: ${args}\n`);
    this.log(`Transaction Sent. Hash: ${txHash}\n`);

    process.exit(0);
  }
}

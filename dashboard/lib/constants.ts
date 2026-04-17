import { ccc } from "@ckb-ccc/ccc";

export const CKB_TIME_TYPE_CONFIG = {
  testnet: {
    cellDepTxHash:
      "0xde1431300a0ce30b0403c5dc0ddefd22664f271d09f17067488e10a8bc48d259",
    cellDepIndex: 0,
    codeHash:
      "0x6297ed70407877b61e1217743a7c29011f4e6a067a1e6767b70c3446acc94b82",
    hashType: ccc.hashTypeFrom("data2"),
    explorerUrl: "https://testnet.explorer.nervos.org",
  },
  mainnet: {
    cellDepTxHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000", // Placeholder
    cellDepIndex: 0,
    codeHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000", // Placeholder
    hashType: ccc.hashTypeFrom("data2"),
    explorerUrl: "https://explorer.nervos.org",
  },
};

export function getNetworkConfig(client: ccc.Client) {
  const isMainnet = client.addressPrefix === "ckb";
  return isMainnet ? CKB_TIME_TYPE_CONFIG.mainnet : CKB_TIME_TYPE_CONFIG.testnet;
}

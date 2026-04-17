"use client";

import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { useCallback, useState } from "react";

export function useGroupSigner() {
  const { client, open } = useCcc();
  const walletSigner = useSigner();

  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState("");

  const getSigner = useCallback(() => {
    if (usePrivateKey) {
      if (!privateKey) throw new Error("Private key is required");
      return new ccc.SignerCkbPrivateKey(client, privateKey);
    }
    if (!walletSigner) {
      open();
      return null;
    }
    return walletSigner;
  }, [usePrivateKey, privateKey, client, walletSigner, open]);

  return {
    usePrivateKey,
    setUsePrivateKey,
    privateKey,
    setPrivateKey,
    getSigner,
  };
}

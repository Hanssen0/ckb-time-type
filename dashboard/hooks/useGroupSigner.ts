"use client";

import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { useMemo, useState } from "react";

export function useGroupSigner() {
  const { client } = useCcc();
  const walletSigner = useSigner();

  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState("");

  const pkSigner = useMemo(() => {
    if (!usePrivateKey || !privateKey) return null;
    try {
      return new ccc.SignerCkbPrivateKey(client, privateKey);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return null;
    }
  }, [usePrivateKey, privateKey, client]);

  const signer = useMemo(() => {
    if (usePrivateKey) {
      return pkSigner;
    }
    return walletSigner;
  }, [usePrivateKey, pkSigner, walletSigner]);

  return {
    usePrivateKey,
    setUsePrivateKey,
    privateKey,
    setPrivateKey,
    signer,
    walletSigner,
    pkSigner,
  };
}

import { useSigner } from "@ckb-ccc/connector-react";
import { useEffect, useState } from "react";

export function useAddress() {
  const signer = useSigner();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!signer) {
      const timer = setTimeout(() => {
        setAddress((prev) => (prev !== null ? null : prev));
      }, 0);
      return () => clearTimeout(timer);
    }

    let active = true;
    signer.getRecommendedAddress().then((addr) => {
      if (active) setAddress(addr);
    });

    return () => {
      active = false;
    };
  }, [signer]);

  return address;
}

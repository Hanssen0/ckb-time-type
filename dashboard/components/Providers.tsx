"use client";

import { ccc } from "@ckb-ccc/connector-react";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ccc.Provider
      clients={[new ccc.ClientPublicTestnet(), new ccc.ClientPublicMainnet()]}
      name="CKB Time Type Dashboard"
    >
      {children}
    </ccc.Provider>
  );
}

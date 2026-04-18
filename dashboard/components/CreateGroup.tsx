"use client";

import { useAddress } from "@/hooks/useAddress";
import { getExplorerTxUrl } from "@/lib/utils";
import { ccc, useCcc } from "@ckb-ccc/connector-react";
import { createGroup as sdkCreateGroup } from "@ckb-time-type/lib";
import { useState } from "react";
import { CheckCircleIcon, ExternalLinkIcon, RefreshIcon } from "./Icons";
import { NumericStepper } from "./NumericStepper";

export function CreateGroup({
  onCreated,
}: {
  onCreated?: (args: string) => void;
}) {
  const { open, client } = useCcc();
  const address = useAddress();
  const signer = ccc.useSigner();

  const [size, setSize] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [createdArgs, setCreatedArgs] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!signer) {
      open();
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    setCreatedArgs(null);

    try {
      const { tx, args } = await sdkCreateGroup(signer, size);
      await tx.completeFeeBy(signer);
      const hash = await signer.sendTransaction(tx);

      setTxHash(hash);
      setCreatedArgs(args);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-bold sm:text-xl">Create New Cell Group</h2>

      {!address ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 py-8 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            Connect your wallet to create a new group
          </p>
          <button
            onClick={open}
            className="cursor-pointer rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <form action={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-center gap-6">
            <NumericStepper
              label="Group Size (N)"
              value={size}
              onChange={setSize}
              max={255}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-bold whitespace-nowrap text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              <RefreshIcon
                loading={loading}
                className={loading ? "" : "hidden"}
              />
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-400">
            This will create {size} cells with the current tip timestamp.
            AlwaysSuccess lock will be used.
          </p>
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 sm:p-4 sm:text-sm dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {txHash && (
        <div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircleIcon />
              <span className="text-sm font-bold">
                Transaction Sent Successfully!
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1 text-zinc-900 dark:text-zinc-50">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Transaction Hash
                </span>
                <span className="font-mono text-xs break-all">{txHash}</span>
              </div>
              {createdArgs && (
                <div className="flex flex-col gap-1 text-zinc-900 dark:text-zinc-50">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    Group Args
                  </span>
                  <span className="font-mono text-xs break-all">
                    {createdArgs}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={getExplorerTxUrl(client, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600"
            >
              View in Explorer <ExternalLinkIcon />
            </a>
            {createdArgs && onCreated && (
              <button
                onClick={() => onCreated(createdArgs)}
                className="cursor-pointer rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                Query this group →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

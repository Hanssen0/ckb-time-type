"use client";

import { useGroupSigner } from "@/hooks/useGroupSigner";
import { OperationLog } from "@/lib/types";
import { findTimeCells, getExplorerTxUrl, supplyTime } from "@/lib/utils";
import { ccc, useCcc } from "@ckb-ccc/connector-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshIcon } from "./Icons";
import { NumericStepper } from "./NumericStepper";

export function SupplyGroup({ initialArgs = "" }: { initialArgs?: string }) {
  const { client } = useCcc();
  const {
    usePrivateKey,
    setUsePrivateKey,
    privateKey,
    setPrivateKey,
    getSigner,
  } = useGroupSigner();

  const [args, setArgs] = useState(initialArgs);
  const [intervalSec, setIntervalSec] = useState(30);
  const [isAutoSupplying, setIsAutoSupplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<OperationLog[]>([]);

  const autoSupplyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (
    msg: string,
    type: OperationLog["type"] = "info",
    txHash?: string,
    prefix?: string,
    suffix?: string,
  ) => {
    const time = new Date().toISOString();
    setLogs((prev) =>
      [{ msg, type, time, txHash, prefix, suffix }, ...prev].slice(0, 50),
    );
  };

  const handleSupply = useCallback(async () => {
    if (!args) {
      addLog("Args are required", "error");
      return;
    }

    setLoading(true);
    try {
      const signer = getSigner();
      if (!signer) return;

      const { cells, n } = await findTimeCells(client, args);
      if (cells.length === 0) throw new Error("No cells found");

      const oldestTimestamp = ccc.numFromBytes(
        cells[cells.length - 1].outputData,
      );
      const newestTimestamp = ccc.numFromBytes(cells[0].outputData);
      const nowTimestamp = (await client.getTipHeader()).timestamp;

      const txHash = await supplyTime(signer, args);
      const logPrefix = `[Update] Group Size: ${n} (${oldestTimestamp} - ${newestTimestamp}), Args: ${args}. Timestamp Updated to ${nowTimestamp}. Transaction Hash: `;

      addLog("", "success", txHash, logPrefix, ".");
      await client.cache.clear();
    } catch (err: unknown) {
      if (err instanceof ccc.ErrorClientRBFRejected) {
        const { cells, n } = await findTimeCells(client, args);
        const oldestTimestamp = ccc.numFromBytes(
          cells[cells.length - 1].outputData,
        );
        const newestTimestamp = ccc.numFromBytes(cells[0].outputData);
        addLog(
          `[Update] Group Size: ${n} (${oldestTimestamp} - ${newestTimestamp}), Args: ${args}. Updating by another supplier.`,
          "info",
        );
        return;
      }
      addLog(err instanceof Error ? err.message : "Supply failed", "error");
      if (isAutoSupplying) setIsAutoSupplying(false);
    } finally {
      setLoading(false);
    }
  }, [args, client, getSigner, isAutoSupplying]);

  useEffect(() => {
    let initialTimer: NodeJS.Timeout | null = null;
    if (isAutoSupplying) {
      initialTimer = setTimeout(() => {
        handleSupply();
      }, 0);
      autoSupplyTimerRef.current = setInterval(
        handleSupply,
        intervalSec * 1000,
      );
    } else {
      if (autoSupplyTimerRef.current) clearInterval(autoSupplyTimerRef.current);
    }
    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (autoSupplyTimerRef.current) clearInterval(autoSupplyTimerRef.current);
    };
  }, [isAutoSupplying, intervalSec, handleSupply]);

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-orange-600 sm:text-xl dark:text-orange-400">
          Supply Timestamps
        </h2>
        <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500">
          <input
            type="checkbox"
            checked={usePrivateKey}
            onChange={(e) => setUsePrivateKey(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Private Key Mode
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-500">
            Target Group Args
          </label>
          <input
            type="text"
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            placeholder="0x..."
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        {usePrivateKey && (
          <div className="animate-in fade-in flex flex-col gap-2 duration-300">
            <label className="text-xs font-medium text-zinc-500">
              Private Key (Unsafe storage, use with caution)
            </label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x..."
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        )}

        <div className="flex flex-wrap items-end justify-center gap-4">
          <NumericStepper
            label="Interval"
            value={intervalSec}
            onChange={setIntervalSec}
            min={1}
            max={3600}
            unit="s"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setIsAutoSupplying(!isAutoSupplying)}
              className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl px-6 text-sm font-bold shadow-md transition-all active:scale-95 ${isAutoSupplying ? "bg-red-500 text-white hover:bg-red-600" : "bg-orange-500 text-white hover:bg-orange-600"}`}
            >
              <RefreshIcon
                loading={isAutoSupplying}
                className={isAutoSupplying ? "" : "hidden"}
              />
              {isAutoSupplying ? "Stop Auto" : "Start Auto"}
            </button>
            <button
              onClick={handleSupply}
              disabled={loading || isAutoSupplying}
              className="h-10 cursor-pointer rounded-xl bg-zinc-900 px-6 text-sm font-bold whitespace-nowrap text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              {loading && !isAutoSupplying ? "Supplying..." : "Supply Once"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
            Operation Logs
          </span>
          <button
            onClick={() => setLogs([])}
            className="cursor-pointer text-[10px] text-zinc-400 hover:text-zinc-600"
          >
            Clear
          </button>
        </div>
        <div className="flex h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap shadow-inner dark:border-zinc-800 dark:bg-zinc-950">
          {logs.length === 0 ? (
            <span className="text-[10px] text-zinc-400 italic">
              No logs yet...
            </span>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-900"
              >
                <span className="text-zinc-400">{log.time} | </span>
                {log.prefix && (
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {log.prefix}
                  </span>
                )}
                {log.txHash ? (
                  <a
                    href={getExplorerTxUrl(client, log.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {log.txHash}
                  </a>
                ) : (
                  <span
                    className={
                      log.type === "error"
                        ? "text-red-500"
                        : log.type === "success"
                          ? "font-bold text-green-500"
                          : "text-zinc-600 dark:text-zinc-400"
                    }
                  >
                    {log.msg}
                  </span>
                )}
                {log.suffix && (
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {log.suffix}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  getExplorerTxUrl,
  formatTimestamp,
  getInactivityTime,
  truncateHex,
} from "@/lib/utils";
import { ccc } from "@ckb-ccc/ccc";
import { useCcc } from "@ckb-ccc/connector-react";
import { findTimeCells, TimeCellGroup } from "@ckb-time-type/lib";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLinkIcon, RefreshIcon, SearchIcon } from "./Icons";

import {
  AUTO_REFRESH_INTERVAL,
  INACTIVITY_THRESHOLD,
} from "@/lib/constants";

export function QueryGroup({ initialArgs }: { initialArgs?: string }) {
  const { client } = useCcc();
  const [args, setArgs] = useState(initialArgs || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TimeCellGroup | null>(null);
  const fetchIdRef = useRef(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchGroup = useCallback(
    async (targetArgs: string) => {
      if (!targetArgs || targetArgs.length < 66) return;

      const currentFetchId = ++fetchIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await findTimeCells(client, targetArgs);
        if (currentFetchId !== fetchIdRef.current) return;
        setResult(res);
      } catch (err: unknown) {
        if (currentFetchId === fetchIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to query group",
          );
          setResult(null);
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [client],
  );

  const { countdown, refresh } = useAutoRefresh({
    interval: AUTO_REFRESH_INTERVAL,
    onRefresh: () => fetchGroup(args),
    enabled: !!(args.length >= 66 && result),
  });

  useEffect(() => {
    if (initialArgs) {
      setArgs(initialArgs);
      fetchGroup(initialArgs);
    }
  }, [initialArgs, fetchGroup]);

  const handleSearch = () => {
    fetchGroup(args);
  };

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold sm:text-xl">Query Cell Group</h2>
        {result && (
          <button
            onClick={refresh}
            disabled={loading}
            className="group flex cursor-pointer items-center gap-2 text-[10px] text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed sm:text-xs dark:hover:text-zinc-200"
          >
            <RefreshIcon
              loading={loading}
              className={
                !loading
                  ? "transition-transform duration-500 group-hover:rotate-180"
                  : ""
              }
            />
            <span>
              {loading ? "Refreshing..." : `Next refresh in ${countdown}s`}
            </span>
          </button>
        )}
      </div>

      <form action={handleSearch} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
            Group Args
          </label>
          <div className="relative">
            <input
              type="text"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 pr-10 font-mono text-xs transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100 focus:outline-none sm:py-3 sm:text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800/50"
            />
            <button
              type="submit"
              disabled={loading || args.length < 66}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <SearchIcon className={loading ? "animate-pulse" : ""} />
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 sm:p-4 sm:text-sm dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && !result && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <p className="text-xs font-medium sm:text-sm">Querying Group...</p>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-300">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
              Cell List
            </h3>
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-zinc-50 text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">OutPoint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {result.cells.map((cell: ccc.Cell, index) => {
                      const timestamp = ccc.numFromBytes(cell.outputData);
                      const isInactive = now - Number(timestamp) > INACTIVITY_THRESHOLD;

                      return (

                        <tr
                          key={`${cell.outPoint.txHash}-${cell.outPoint.index}`}
                          className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="px-4 py-3 font-medium text-zinc-400">
                            {index + 1}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${isInactive ? "text-orange-500 dark:text-orange-400" : "text-zinc-500 dark:text-zinc-400"}`}
                          >
                            {getInactivityTime(timestamp, now)} ago
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                            {formatTimestamp(timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={getExplorerTxUrl(
                                client,
                                cell.outPoint.txHash,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 font-mono text-[10px] text-blue-500 hover:text-blue-600 sm:text-xs"
                            >
                              {truncateHex(cell.outPoint.txHash)}#
                              {cell.outPoint.index}
                              <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

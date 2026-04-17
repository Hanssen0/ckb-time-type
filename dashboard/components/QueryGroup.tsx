"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { QueryResult } from "@/lib/types";
import {
  findTimeCells,
  formatTimestamp,
  getExplorerTxUrl,
  getInactivityTime,
  truncateHex,
} from "@/lib/utils";
import { ccc } from "@ckb-ccc/ccc";
import { useCcc } from "@ckb-ccc/connector-react";
import React, { useCallback, useState } from "react";
import { ExternalLinkIcon, RefreshIcon } from "./Icons";

export function QueryGroup({ initialArgs = "" }: { initialArgs?: string }) {
  const { client } = useCcc();
  const [args, setArgs] = useState(initialArgs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  const fetchDetails = useCallback(
    async (targetArgs = args) => {
      if (!targetArgs) return;
      setLoading(true);
      setError(null);
      try {
        const res = await findTimeCells(client, targetArgs);
        setResult(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to query");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [args, client],
  );

  const { countdown, refresh } = useAutoRefresh({
    interval: 10,
    onRefresh: fetchDetails,
    enabled: !!(args && result),
  });

  // Handle initial query
  React.useEffect(() => {
    if (initialArgs) {
      const timer = setTimeout(() => {
        fetchDetails(initialArgs);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialArgs, fetchDetails]);

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchDetails();
        }}
        className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-50"
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="args"
            className="text-xs font-medium text-zinc-500 sm:text-sm"
          >
            Group Args (Hex)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="args"
              type="text"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="0x..."
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-zinc-500 sm:px-4 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:px-6 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              <RefreshIcon loading={loading} />
              {loading ? "Querying..." : "Query"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 sm:p-4 sm:text-sm dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 pb-4 sm:pb-6 dark:border-zinc-800">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase sm:text-xs">
                  Expected Size (N)
                </p>
                <p className="text-xl font-bold sm:text-3xl">{result.n}</p>
              </div>
              {result.cells.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase sm:text-xs">
                    Inactivity
                  </p>
                  <p className="text-xs font-medium text-orange-500 sm:text-sm">
                    {getInactivityTime(
                      ccc.numFromBytes(result.cells[0].outputData),
                    )}{" "}
                    ago
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-3 text-zinc-900 sm:gap-4 dark:text-zinc-50">
              <div>
                <p className="text-right text-[10px] font-semibold tracking-wider text-zinc-500 uppercase sm:text-xs">
                  Found
                </p>
                <p className="text-right text-xl font-bold sm:text-3xl">
                  {result.cells.length}
                </p>
              </div>
              {result.cells.length > 0 && (
                <div className="text-right text-zinc-900 dark:text-zinc-50">
                  <p className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase sm:text-xs">
                    Latest
                  </p>
                  <p className="font-mono text-[10px] text-zinc-600 sm:text-sm dark:text-zinc-400">
                    {
                      formatTimestamp(
                        ccc.numFromBytes(result.cells[0].outputData),
                      ).split(",")[1]
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                    #
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                    OutPoint
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {result.cells.map((cell, index) => (
                  <tr
                    key={`${cell.outPoint.txHash}-${cell.outPoint.index}`}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 text-zinc-500">{index}</td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {formatTimestamp(ccc.numFromBytes(cell.outputData))}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                      <a
                        href={getExplorerTxUrl(client, cell.outPoint.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-1 font-mono text-blue-500 transition-colors hover:text-blue-600 hover:underline"
                      >
                        {truncateHex(cell.outPoint.txHash)}#
                        {cell.outPoint.index}
                        <ExternalLinkIcon />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { TimeCellGroup } from "@/lib/types";
import {
  discoverTimeCellGroups,
  getInactivityTime,
  truncateHex,
} from "@/lib/utils";
import { useCcc } from "@ckb-ccc/connector-react";
import React, { useCallback, useMemo, useState } from "react";
import { ChevronRightIcon, RefreshIcon } from "./Icons";

export function DiscoverGroups({
  onSelectGroup,
}: {
  onSelectGroup: (args: string) => void;
}) {
  const { client } = useCcc();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<TimeCellGroup[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await discoverTimeCellGroups(client);
      setGroups(data);
      setCurrentPage(1);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to discover groups",
      );
    } finally {
      setLoading(false);
    }
  }, [client]);

  const { countdown, refresh } = useAutoRefresh({
    interval: 10,
    onRefresh: fetchGroups,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchGroups]); // Run on mount and if fetchGroups changes

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return groups.slice(startIndex, startIndex + itemsPerPage);
  }, [groups, currentPage]);

  return (
    <div className="relative flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="text-lg font-bold sm:text-xl">Discover All Groups</h2>
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
            {loading ? "Discovering..." : `Refreshing in ${countdown}s`}
          </span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 sm:p-4 sm:text-sm dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {currentItems.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((group) => (
              <div
                key={group.args}
                onClick={() => onSelectGroup(group.args)}
                className="group relative cursor-pointer rounded-xl border border-zinc-200 p-4 shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
              >
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Group Args
                      </span>
                      <span className="font-mono text-[10px] break-all text-zinc-600 sm:text-xs dark:text-zinc-400">
                        {truncateHex(group.args, 10, 8)}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:py-1 sm:text-xs ${
                        group.count === group.n
                          ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20"
                          : "border-yellow-200 bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {group.count} / {group.n}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-400">
                        Last Active
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 sm:text-xs">
                        {getInactivityTime(group.latestTimestamp)} ago
                      </span>
                    </div>
                    <div className="flex items-center text-xs font-semibold text-blue-500 transition-transform group-hover:translate-x-1 sm:text-sm">
                      View Details{" "}
                      <ChevronRightIcon className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                }}
                disabled={currentPage === 1}
                className="cursor-pointer rounded-lg p-2 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage(page);
                      }}
                      className={`h-8 w-8 cursor-pointer rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black" : "text-zinc-500 hover:bg-zinc-100"}`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                }}
                disabled={currentPage === totalPages}
                className="cursor-pointer rounded-lg p-2 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 sm:py-12 sm:text-sm dark:border-zinc-800">
            No groups discovered yet. Automatic discovery is in progress...
          </div>
        )
      )}
    </div>
  );
}

"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getInactivityTime, truncateHex } from "@/lib/utils";
import { useCcc } from "@ckb-ccc/connector-react";
import { discoverTimeCellGroups, TimeCellGroupInfo } from "@ckb-cto/lib";
import React, { useCallback, useEffect, useState } from "react";
import { ChevronRightIcon, RefreshIcon } from "./Icons";
import { SectionHeader } from "./SectionHeader";

import { AUTO_REFRESH_INTERVAL, MAX_DISCOVER_GROUPS } from "@/lib/constants";

export function DiscoverGroups({
  onSelectGroup,
}: {
  onSelectGroup: (args: string) => void;
}) {
  const { client } = useCcc();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<TimeCellGroupInfo[]>([]);
  const [limit, setLimit] = useState(MAX_DISCOVER_GROUPS);
  const fetchIdRef = React.useRef(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchGroups = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const foundGroups: TimeCellGroupInfo[] = [];
      for await (const group of discoverTimeCellGroups(client)) {
        if (currentFetchId !== fetchIdRef.current) return;
        foundGroups.push(group);
        if (foundGroups.length >= limit) {
          break;
        }
      }

      if (currentFetchId === fetchIdRef.current) {
        setGroups(
          foundGroups.sort((a, b) =>
            Number(b.latestTimestamp - a.latestTimestamp),
          ),
        );
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to discover groups",
        );
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [client, limit]);

  const { countdown, refresh } = useAutoRefresh({
    interval: AUTO_REFRESH_INTERVAL,
    onRefresh: fetchGroups,
  });

  const handleLoadMore = () => {
    setLimit((prev) => prev + MAX_DISCOVER_GROUPS);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchGroups]); // Run on mount and if fetchGroups changes

  return (
    <div className="relative flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <SectionHeader title="Discover Oracles">
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
      </SectionHeader>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 sm:p-4 sm:text-sm dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {groups.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.args}
                onClick={() => onSelectGroup(group.args)}
                className="group relative cursor-pointer rounded-xl border border-zinc-200 p-4 shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
              >
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Oracle Args
                      </span>
                      <span className="font-mono text-[10px] break-all text-zinc-600 sm:text-xs dark:text-zinc-400">
                        {truncateHex(group.args, 10, 8)}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 sm:px-2.5 sm:py-1 sm:text-xs dark:bg-green-900/20">
                      Size: {group.n}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-400">
                        Last Active
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 sm:text-xs">
                        {getInactivityTime(group.latestTimestamp, now)} ago
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

          {groups.length >= limit && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-8 py-2 text-sm font-bold text-zinc-600 transition-all hover:border-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
              >
                {loading ? "Discovering More..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 sm:py-12 sm:text-sm dark:border-zinc-800">
            No oracles discovered yet. Automatic discovery is in progress...
          </div>
        )
      )}
    </div>
  );
}

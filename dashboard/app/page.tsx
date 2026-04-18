"use client";
import { CreateGroup } from "@/components/CreateGroup";
import { DiscoverGroups } from "@/components/DiscoverGroups";
import { GitHubIcon } from "@/components/Icons";
import { QueryGroup } from "@/components/QueryGroup";
import { SupplyGroup } from "@/components/SupplyGroup";
import { useAddress } from "@/hooks/useAddress";
import { useCcc } from "@ckb-ccc/connector-react";
import { useState } from "react";

export default function Home() {
  const [queryKey, setQueryKey] = useState<{
    args: string;
    nonce: number;
  } | null>(null);
  const [supplyArgs, setSupplyArgs] = useState<string>("");
  const { open, wallet } = useCcc();
  const address = useAddress();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white px-4 py-4 sm:px-8 sm:py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Hanssen0/ckb-cto"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
              title="Project Repository"
            >
              <GitHubIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </a>
            <div className="flex flex-col text-left">
              <h1 className="text-lg leading-none font-bold tracking-tight sm:text-2xl">
                CTO
              </h1>
              <p className="mt-1 text-[10px] text-zinc-500 sm:text-sm">
                CKB Time Oracle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {address ? (
              <button
                onClick={open}
                className="group flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 transition-all hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                {wallet?.icon && (
                  <img
                    src={wallet.icon}
                    alt={wallet.name}
                    className="h-5 w-5 rounded-full shadow-sm"
                  />
                )}
                <span className="font-mono text-xs font-medium text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-50">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <svg
                  className="h-3 w-3 text-zinc-400 transition-transform group-hover:translate-y-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={open}
                className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-all hover:shadow-lg active:scale-95 dark:bg-zinc-50 dark:text-black"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 sm:gap-12 sm:p-8">
        <section id="discover">
          <DiscoverGroups
            onSelectGroup={(args) => {
              setQueryKey({ args, nonce: Date.now() });
              setSupplyArgs(args);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>

        <section id="query">
          {/* Use key with nonce to force re-mount and refresh even if same args are selected */}
          <QueryGroup
            key={queryKey ? `${queryKey.args}-${queryKey.nonce}` : "empty"}
            initialArgs={queryKey?.args || ""}
          />
        </section>

        <section id="create">
          <CreateGroup
            onCreated={(args) => {
              setQueryKey({ args, nonce: Date.now() });
              setSupplyArgs(args);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>

        <section id="supply">
          <SupplyGroup key={supplyArgs} initialArgs={supplyArgs} />
        </section>
      </main>

      <footer className="border-t border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        <p>
          Built with{" "}
          <a
            href="https://github.com/ckb-devrel/ccc"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            CKB CCC
          </a>{" "}
          & Next.js
        </p>
      </footer>
    </div>
  );
}

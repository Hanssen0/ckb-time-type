"use client";

import React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  suffix?: React.ReactNode;
  containerClassName?: string;
}

export function TextInput({
  label,
  error,
  suffix,
  className = "",
  containerClassName = "",
  ...props
}: TextInputProps) {
  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          className={`w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-xs text-zinc-900 transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100 focus:outline-none sm:py-3 sm:text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:bg-zinc-900 dark:focus:ring-zinc-800/50 ${suffix ? "pr-10" : ""} ${className}`}
        />
        {suffix && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

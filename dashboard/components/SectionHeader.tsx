"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  children?: ReactNode;
}

export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
      <h2 className="text-lg font-bold text-zinc-900 sm:text-xl dark:text-zinc-50">
        {title}
      </h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

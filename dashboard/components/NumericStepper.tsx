"use client";

interface NumericStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  unit?: string;
}

export function NumericStepper({
  label,
  value,
  min = 1,
  max = 255,
  onChange,
  unit,
}: NumericStepperProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <label className="text-xs font-medium text-zinc-500 sm:text-sm">
        {label}
      </label>
      <div className="flex h-10 items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-600 shadow-sm transition-all hover:bg-white hover:text-zinc-900 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M20 12H4"
            />
          </svg>
        </button>
        <div className="flex items-center px-1">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              const val = parseInt(e.target.value.replace(/\D/g, "")) || 0;
              onChange(Math.min(max, val));
            }}
            onBlur={() => {
              if (value < min) onChange(min);
            }}
            className="w-10 bg-transparent text-center text-base font-bold outline-none"
          />
          {unit && (
            <span className="mr-1 text-xs font-medium text-zinc-400">
              {unit}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-600 shadow-sm transition-all hover:bg-white hover:text-zinc-900 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Check, Copy, History, Trash2 } from 'lucide-react';
import { HistoryEntry } from '../types/calculator';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onReuseResult: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onReuseResult,
  onDeleteEntry,
  onClearAll,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (
    e: React.MouseEvent,
    entry: HistoryEntry
  ) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(entry.result.replace(/,/g, ''));
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Calculation History
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tap any calculation to reuse its result. Stored locally on your device.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 whitespace-nowrap cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 p-10 text-center">
          <History className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            No calculations yet
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Press = on the calculator to save your first calculation here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {history.map((entry) => {
            const timeStr = new Date(entry.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={entry.id}
                onClick={() => onReuseResult(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onReuseResult(entry);
                  }
                }}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular truncate">
                    {entry.expression} · {timeStr}
                    {entry.reaction ? ` · ${entry.reaction}` : ''}
                  </div>
                  <div className="mt-0.5 font-mono-tabular text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    = {entry.result}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, entry)}
                    aria-label="Copy calculation result"
                    className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedId === entry.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntry(entry.id);
                    }}
                    aria-label="Delete history entry"
                    className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

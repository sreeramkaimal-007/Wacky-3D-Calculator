import React, { useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import {
  ANDROID_BLUEPRINT_FILES,
  PLAY_STORE_CHECKLIST,
  PRIVACY_POLICY_TEXT,
} from '../data/AndroidProjectExport';

interface AndroidBlueprintDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const AndroidBlueprintDrawer: React.FC<AndroidBlueprintDrawerProps> = ({
  open,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const activeFile = ANDROID_BLUEPRINT_FILES[selectedIndex];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore
    }
  };

  const handleDownloadFile = () => {
    const filename = activeFile.path.split('/').pop() || 'source.kt';
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Android Studio Kotlin Project & Play Store Guide"
    >
      <div className="w-full max-w-5xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Android Studio Kotlin Blueprint & Play Store Release Guide
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jetpack Compose · Material 3 · SoundPool · AdMob · Signed AAB
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 studio-scroll">
          {/* File Tabs */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {ANDROID_BLUEPRINT_FILES.map((file, idx) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-mono-tabular font-medium transition-colors cursor-pointer ${
                    idx === selectedIndex
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {file.path.split('/').pop()}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 text-slate-100">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-mono-tabular text-sky-300 truncate">
                    {activeFile.path}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {activeFile.summary}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="min-h-[34px] px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="min-h-[34px] px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 text-xs font-mono-tabular overflow-x-auto max-h-[320px] leading-relaxed studio-scroll">
                <code>{activeFile.content}</code>
              </pre>
            </div>
          </div>

          {/* AAB & Play Console Checklist */}
          <div className="grid md:grid-cols-3 gap-4">
            {PLAY_STORE_CHECKLIST.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40"
              >
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
                  {section.title}
                </h3>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                  {section.steps.map((s) => (
                    <li key={s} className="leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* Privacy Policy Template */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
              Google Play Privacy Policy Template
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {PRIVACY_POLICY_TEXT}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

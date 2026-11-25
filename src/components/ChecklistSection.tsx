import { Check, RotateCcw } from 'lucide-react';
import type { ChecklistItemDef } from '../data/cities';

interface ChecklistSectionProps {
  id: string;
  title: string;
  subtitle: string;
  items: ChecklistItemDef[];
  checkedIds: string[];
  onToggle: (itemId: string) => void;
  onReset: () => void;
  dynamicHints?: Record<string, string>;
}

export function ChecklistSection({
  id,
  title,
  subtitle,
  items,
  checkedIds,
  onToggle,
  onReset,
  dynamicHints,
}: ChecklistSectionProps) {
  const completedCount = items.filter((item) => checkedIds.includes(item.id)).length;
  const progressPercent =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="rounded-2xl bg-white border border-[#DCE4E0] p-6 sm:p-7 flex flex-col justify-between gap-5"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={`${id}-heading`}
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#111C18]"
            >
              {title}
            </h2>
            <p className="text-sm text-[#52605B] mt-1">{subtitle}</p>
          </div>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              aria-label={`Reset ${title}`}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-[#52635C] hover:text-[#111C18] hover:bg-[#EFF3F1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#52635C]">
            <span data-testid={`${id}-count`} className="font-mono font-semibold tabular-nums text-[#111C18]">
              {completedCount} / {items.length} done today
            </span>
            <span className="font-mono tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#EAF0ED] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0F5E4A] transition-all duration-300 motion-reduce:transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist Rows */}
        <ul className="divide-y divide-[#EDF2F0]">
          {items.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            const liveHint = dynamicHints?.[item.id];
            return (
              <li key={item.id}>
                <label className="flex items-start gap-3.5 py-3.5 min-h-[56px] cursor-pointer group">
                  <span className="relative flex items-center justify-center mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(item.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0B4A3A] ${
                        isChecked
                          ? 'bg-[#0F5E4A] border-[#0F5E4A] text-white'
                          : 'bg-white border-[#8EA198] group-hover:border-[#0F5E4A]'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.75]" aria-hidden="true" />}
                    </span>
                  </span>

                  <span className="flex-1 min-w-0 space-y-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span
                        className={`text-sm font-medium leading-snug transition-colors ${
                          isChecked ? 'line-through text-[#52635C]' : 'text-[#111C18]'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-[11px] font-medium text-[#4A5B54] whitespace-nowrap shrink-0">
                        {item.impactLabel}
                      </span>
                    </span>
                    <span className="block text-xs text-[#4A5B54] leading-relaxed">
                      {liveHint ?? item.detail}
                    </span>
                    <span className="block text-xs text-[#1E5239] leading-relaxed pt-0.5">
                      <strong className="font-semibold">Why this helps:</strong> {item.whyThisHelps}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

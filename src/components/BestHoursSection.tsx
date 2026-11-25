import { useEffect, useMemo, useState } from 'react';
import { Clock, ShieldAlert, Sun } from 'lucide-react';
import {
  findBestAndWorstWindows,
  formatHourLabel,
  getAqiBand,
  type DayForecastSummary,
} from '../utils/aqi';

interface BestHoursSectionProps {
  cityName: string;
  cityHindiName: string;
  days: DayForecastSummary[];
  selectedDayIndex: number;
  onSelectDay: (idx: number) => void;
}

type ChartViewMode = 'today-tomorrow' | 'single';

interface HourlyDayChartProps {
  day: DayForecastSummary;
  compact?: boolean;
}

function HourlyDayChart({ day, compact = false }: HourlyDayChartProps) {
  const hourly = day.hourly;
  const { best, worst } = useMemo(
    () => findBestAndWorstWindows(hourly, 3),
    [hourly]
  );

  const [focusedHour, setFocusedHour] = useState<number | null>(
    best?.startHour ?? hourly[0]?.hour ?? null
  );

  useEffect(() => {
    setFocusedHour(best?.startHour ?? hourly[0]?.hour ?? null);
  }, [day.dateKey, best?.startHour]);

  if (hourly.length === 0) return null;

  const maxChartAqi = Math.max(200, ...hourly.map((h) => h.usAqi));
  const selectedPoint =
    hourly.find((h) => h.hour === focusedHour) ?? hourly[0];
  const selectedBand = selectedPoint ? getAqiBand(selectedPoint.usAqi) : null;
  const bestBand = best ? getAqiBand(best.avgAqi) : null;
  const worstBand = worst ? getAqiBand(worst.avgAqi) : null;

  const isInBestWindow = (hour: number) => {
    if (!best) return false;
    return hour >= best.startHour && hour < best.startHour + 3;
  };

  return (
    <div
      data-testid={`hourly-chart-${day.label.toLowerCase()}`}
      className="rounded-xl bg-[#FAFDFC] border border-[#E2EAE6] p-4 sm:p-5 space-y-4"
    >
      {/* Day Header + Cleanest & Peak Summary */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-[#111C18]">
            {day.label}{' '}
            <span className="font-sans text-sm font-normal text-[#4A5B54]">
              · {day.shortDate}
            </span>
          </h3>
          <p className="text-xs text-[#4A5B54] mt-0.5 tabular-nums">
            Range {day.minAqi}–{day.maxAqi} US AQI · Daily avg {day.avgAqi}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {best && bestBand && (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#14532D]">
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-xs bg-[#15803D]/25 border border-[#15803D]"
              />
              <span>
                Cleanest: <strong className="font-mono tabular-nums">{best.rangeLabel}</strong> (Avg {best.avgAqi})
              </span>
            </span>
          )}
          {worst && worstBand && (
            <span className="text-[#8B2323] font-medium">
              Peak: <strong className="font-mono tabular-nums">{worst.rangeLabel}</strong> (Avg {worst.avgAqi})
            </span>
          )}
        </div>
      </div>

      {/* Selected Hour Inspection Strip */}
      {selectedPoint && selectedBand && (
        <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 px-3.5 rounded-lg bg-white border border-[#E4EBE7] text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-[#111C18] font-medium">
            <Clock className="w-4 h-4 text-[#0F5E4A] shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{formatHourLabel(selectedPoint.hour)}</span>
            <span aria-hidden="true" className="text-[#9AA8A2]">·</span>
            <span style={{ color: selectedBand.colorHex }} className="font-semibold">
              AQI {selectedPoint.usAqi} ({selectedBand.label})
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#4A5B54] font-mono tabular-nums">
            <span>PM2.5: {selectedPoint.pm25} µg/m³</span>
            {isInBestWindow(selectedPoint.hour) && (
              <>
                <span aria-hidden="true" className="text-[#9AA8A2]">·</span>
                <span className="font-sans font-semibold text-[#15623A]">
                  Cleanest hours
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Interactive 24-Hour Bar Chart */}
      <div className="overflow-x-auto pb-1">
        <div
          className="min-w-[540px] pt-2"
          role="group"
          aria-label={`Hourly US AQI chart for ${day.label}`}
        >
          <div
            className={`grid grid-cols-24 gap-1 items-end px-1 ${
              compact ? 'h-36' : 'h-44'
            }`}
          >
            {hourly.map((pt) => {
              const barBand = getAqiBand(pt.usAqi);
              const heightPct = Math.max(
                10,
                Math.round((pt.usAqi / maxChartAqi) * 100)
              );
              const isSelected = pt.hour === selectedPoint?.hour;
              const inBest = isInBestWindow(pt.hour);

              return (
                <button
                  key={pt.time}
                  type="button"
                  onClick={() => setFocusedHour(pt.hour)}
                  onMouseEnter={() => setFocusedHour(pt.hour)}
                  aria-label={`${day.label} ${formatHourLabel(pt.hour)}, AQI ${pt.usAqi}, ${barBand.label}, PM2.5 ${pt.pm25}${inBest ? ', cleanest hours' : ''}`}
                  aria-pressed={isSelected}
                  className={`group relative flex flex-col items-center justify-end h-full rounded-t-md transition-colors cursor-pointer pt-5 ${
                    inBest
                      ? 'bg-[#DFF3E6] ring-1 ring-inset ring-[#15803D]/25'
                      : 'hover:bg-[#EEF3F0]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 text-[10px] font-mono tabular-nums transition-opacity motion-reduce:transition-none ${
                      isSelected
                        ? 'opacity-100 font-bold text-[#111C18]'
                        : 'opacity-0 group-hover:opacity-100 text-[#4A5B54]'
                    }`}
                  >
                    {pt.usAqi}
                  </span>
                  <span
                    className={`w-full max-w-[16px] rounded-t-sm transition-all motion-reduce:transition-none ${
                      isSelected
                        ? 'ring-2 ring-[#111C18] ring-offset-1'
                        : 'opacity-85 group-hover:opacity-100'
                    }`}
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: barBand.colorHex,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-24 gap-1 mt-2 px-1 border-t border-[#E6ECE9] pt-2">
            {hourly.map((pt) => (
              <div
                key={`lbl-${pt.time}`}
                className="text-center text-[10px] font-mono text-[#4A5B54] tabular-nums"
              >
                {pt.hour % 3 === 0 ? formatHourLabel(pt.hour).replace(' ', '') : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BestHoursSection({
  cityName,
  cityHindiName,
  days,
  selectedDayIndex,
  onSelectDay,
}: BestHoursSectionProps) {
  const [viewMode, setViewMode] = useState<ChartViewMode>('today-tomorrow');

  const today = days[0];
  const tomorrow = days[1];
  const activeDay = days[selectedDayIndex] ?? days[0];

  const { best: todayBest, worst: todayWorst } = useMemo(
    () => findBestAndWorstWindows(today?.hourly ?? [], 3),
    [today]
  );

  if (!today || today.hourly.length === 0) {
    return null;
  }

  const bestBand = todayBest ? getAqiBand(todayBest.avgAqi) : null;
  const worstBand = todayWorst ? getAqiBand(todayWorst.avgAqi) : null;

  return (
    <section
      id="best-hours"
      aria-labelledby="best-hours-heading"
      className="rounded-2xl bg-white border border-[#DCE4E0] p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2
            id="best-hours-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C18]"
          >
            Best hours to go out · Today & Tomorrow
          </h2>
          <p className="text-sm text-[#52605B] mt-1">
            Hourly US AQI forecast for {cityName}{' '}
            {cityHindiName !== cityName && <span lang="hi">({cityHindiName})</span>} with cleanest daytime hours highlighted in green
          </p>
        </div>

        {/* View Mode & Day Selector */}
        <div
          role="tablist"
          aria-label="Hourly forecast view"
          className="inline-flex items-center p-1 rounded-lg bg-[#EFF3F1] self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'today-tomorrow'}
            onClick={() => setViewMode('today-tomorrow')}
            className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'today-tomorrow'
                ? 'bg-white text-[#111C18] shadow-xs'
                : 'text-[#52635C] hover:text-[#111C18]'
            }`}
          >
            Today & Tomorrow
          </button>
          {days.map((day, idx) => {
            const active = viewMode === 'single' && idx === selectedDayIndex;
            return (
              <button
                key={day.dateKey}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setViewMode('single');
                  onSelectDay(idx);
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#111C18] shadow-xs'
                    : 'text-[#52635C] hover:text-[#111C18]'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Cleanest & Peak Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {todayBest && bestBand && (
          <div className="rounded-xl bg-[#F4FAF6] border border-[#CFE6D7] p-4 sm:p-5 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#15623A]">
                <Sun className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Cleanest 3-hour daytime window today</span>
              </div>
              <div
                data-testid="best-hours-window"
                className="font-display text-2xl font-bold text-[#111C18] tabular-nums"
              >
                {todayBest.rangeLabel}
              </div>
              <p className="text-xs sm:text-sm text-[#43564E]">
                {todayBest.avgAqi <= 100
                  ? 'Ideal window for outdoor walks, errands, and opening windows for cross-ventilation.'
                  : todayBest.avgAqi <= 150
                    ? 'Best window for quick errands and brief 15-minute cross-ventilation; sensitive groups should wear a mask.'
                    : 'Lowest-pollution daytime slot today, though air stays unhealthy—keep outdoor trips brief with an N95 and keep windows mostly closed.'}
              </p>
              <p className="text-xs text-[#2B5A42] pt-1">
                <strong className="font-semibold">Why this helps:</strong> Daytime sunlight warms surface air and raises the mixing layer, dispersing trapped PM2.5 so lungs inhale fewer particles per breath.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div
                className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: bestBand.colorHex }}
              >
                {todayBest.avgAqi}
              </div>
              <div className="text-xs font-medium text-[#42534C]">
                Avg AQI · {bestBand.label}
              </div>
              <div className="text-[11px] font-mono text-[#4A5B54] tabular-nums mt-0.5">
                {todayBest.avgPm25} µg/m³
              </div>
            </div>
          </div>
        )}

        {todayWorst && worstBand && (
          <div className="rounded-xl bg-[#FDF6F6] border border-[#F2D4D4] p-4 sm:p-5 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9F1D1D]">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Peak smog hours to avoid today</span>
              </div>
              <div className="font-display text-2xl font-bold text-[#111C18] tabular-nums">
                {todayWorst.rangeLabel}
              </div>
              <p className="text-xs sm:text-sm text-[#584545]">
                Keep exterior doors & windows shut and skip outdoor cardio during this peak trap window.
              </p>
              <p className="text-xs text-[#7D2B2B] pt-1">
                <strong className="font-semibold">Why this helps:</strong> Avoiding peak inversion hours prevents inhaling concentrated fine soot when stagnant air locks exhaust near ground level.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div
                className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: worstBand.colorHex }}
              >
                {todayWorst.avgAqi}
              </div>
              <div className="text-xs font-medium text-[#5F4848]">
                Peak Avg · {worstBand.label}
              </div>
              <div className="text-[11px] font-mono text-[#5F4848] tabular-nums mt-0.5">
                {todayWorst.avgPm25} µg/m³
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hourly Charts: Today & Tomorrow Dual View OR Single Focused Day */}
      {viewMode === 'today-tomorrow' ? (
        <div className="space-y-4">
          <HourlyDayChart day={today} compact />
          {tomorrow && <HourlyDayChart day={tomorrow} compact />}
        </div>
      ) : (
        <HourlyDayChart day={activeDay} />
      )}
    </section>
  );
}

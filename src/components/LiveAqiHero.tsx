import {
  AlertCircle,
  Cigarette,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { IndianCity } from '../data/cities';
import {
  AQI_BANDS,
  computeAqiTrend,
  getAqiBand,
  getAqiScalePercent,
  getCigaretteEquivalentInfo,
  getWhoPm10Ratio,
  getWhoPm25Ratio,
  type LiveAirQualityData,
} from '../utils/aqi';

interface LiveAqiHeroProps {
  city: IndianCity;
  data: LiveAirQualityData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedDayIndex: number;
  onSelectDay: (idx: number) => void;
}

export function LiveAqiHero({
  city,
  data,
  isLoading,
  error,
  onRetry,
  selectedDayIndex,
  onSelectDay,
}: LiveAqiHeroProps) {
  if (error && !data) {
    return (
      <div
        role="alert"
        className="rounded-2xl bg-white border border-[#F2CACA] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#B91C1C] mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-[#111C18]">
              We couldn’t load live air quality for {city.name} right now
            </h1>
            <p className="text-sm text-[#4A5B54] mt-1">
              The Open-Meteo air quality service didn’t respond ({error}). Check your connection and tap Try Again.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-[#0F5E4A] text-white text-sm font-medium hover:bg-[#0B4A3A] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div
        aria-busy="true"
        aria-label={`Loading live air quality for ${city.name}`}
        className="rounded-2xl bg-white border border-[#E2E8E5] p-6 sm:p-8 space-y-5"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C18]">
          {city.name}
        </h1>
        <p role="status" className="text-sm font-medium text-[#0F5E4A]">
          Fetching live AQI, PM2.5, PM10, and hourly forecast for {city.name}...
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse motion-reduce:animate-none">
          <div className="lg:col-span-7 space-y-5">
            <div className="h-7 w-56 bg-[#E6ECE9] rounded-md" />
            <div className="h-24 w-44 bg-[#E6ECE9] rounded-xl" />
            <div className="h-3 w-full bg-[#E6ECE9] rounded-full" />
            <div className="h-5 w-4/5 bg-[#E6ECE9] rounded-md" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 bg-[#EEF2F0] rounded-xl" />
              <div className="h-28 bg-[#EEF2F0] rounded-xl" />
            </div>
            <div className="h-24 bg-[#EEF2F0] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const band = getAqiBand(data.current.usAqi);
  const scalePercent = getAqiScalePercent(data.current.usAqi);
  const cigaretteInfo = getCigaretteEquivalentInfo(data.current.pm25);
  const trend = computeAqiTrend(
    data.current.usAqi,
    data.current.time,
    data.days[0]?.hourly ?? []
  );
  const updatedTime = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(data.fetchedAt));

  return (
    <div className="rounded-2xl bg-white border border-[#DCE4E0] overflow-hidden">
      {/* Screen-reader live region announcing AQI & city updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="aqi-live-announcer"
        className="sr-only"
      >
        Live air quality for {city.name}: US AQI {data.current.usAqi}, {band.label}. PM2.5 is{' '}
        {data.current.pm25} micrograms per cubic meter.{' '}
        {trend ? `${trend.accessibleLabel}. ` : ''}
        {cigaretteInfo.headline}.
      </div>

      {error && (
        <div
          role="alert"
          className="px-6 py-2.5 bg-[#FEF2F2] border-b border-[#FECACA] text-xs text-[#991B1B] flex items-center justify-between gap-4"
        >
          <span>Refresh failed ({error}). Showing last loaded readings.</span>
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Primary City + Big Color-Coded AQI Readout */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111C18]">
                {city.name}
              </h1>
              {city.hindiName !== city.name && (
                <span
                  lang="hi"
                  className="text-2xl sm:text-3xl font-semibold text-[#44564F]"
                >
                  {city.hindiName}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#4A5B54] flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span>
                {city.district &&
                city.district.toLowerCase() !== city.name.toLowerCase() &&
                city.district.toLowerCase() !== city.state.toLowerCase()
                  ? `${city.district}, ${city.state}`
                  : city.state}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  data-testid="live-pulse-dot"
                  className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse motion-reduce:animate-none"
                />
                <span>Live Open-Meteo reading</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Updated {updatedTime} IST</span>
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-medium text-[#4A5B54] mb-1">US Air Quality Index</p>
              <div
                data-testid="live-aqi-value"
                className="font-display text-7xl sm:text-8xl font-bold leading-none tracking-tight tabular-nums"
                style={{ color: band.colorHex }}
              >
                {data.current.usAqi}
              </div>
            </div>

            <div className="pb-1.5 space-y-1.5">
              <div
                data-testid="live-aqi-category"
                className="text-xl sm:text-2xl font-display font-bold tracking-tight"
                style={{ color: band.colorHex }}
              >
                {band.label}
              </div>
              <div className="text-sm text-[#42534C] flex items-center gap-2">
                <span lang="hi">{band.hindiLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-xs tabular-nums">Band {band.range}</span>
              </div>
              {trend && (
                <div
                  data-testid="aqi-trend-badge"
                  aria-label={trend.accessibleLabel}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    trend.direction === 'worsening'
                      ? 'text-[#991B1B]'
                      : trend.direction === 'improving'
                        ? 'text-[#14532D]'
                        : 'text-[#42534C]'
                  }`}
                >
                  {trend.direction === 'worsening' ? (
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : trend.direction === 'improving' ? (
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="tabular-nums">{trend.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* AQI Band Scale Gauge */}
          <div className="space-y-2">
            <div
              role="meter"
              aria-label="US Air Quality Index gauge"
              aria-valuemin={0}
              aria-valuemax={500}
              aria-valuenow={Math.min(500, Math.max(0, data.current.usAqi))}
              aria-valuetext={`US AQI ${data.current.usAqi}, ${band.label} (${band.range})`}
              data-testid="aqi-gauge"
              className="relative pt-2 pb-1"
            >
              <div className="grid grid-cols-6 h-2.5 rounded-full overflow-hidden gap-0.5">
                {AQI_BANDS.map((b) => (
                  <div
                    key={b.key}
                    style={{ backgroundColor: b.colorHex }}
                    className="h-full"
                    title={`${b.label} (${b.range})`}
                  />
                ))}
              </div>
              <div
                aria-hidden="true"
                data-testid="aqi-gauge-marker"
                className="absolute top-0.5 w-3.5 h-5 rounded-sm bg-[#111C18] border-2 border-white shadow-sm -translate-x-1/2 transition-all duration-300 motion-reduce:transition-none"
                style={{ left: `${scalePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#4A5B54] tabular-nums">
              <span>0 Good</span>
              <span>100 Mod</span>
              <span>200 Unhealthy</span>
              <span>300+ Haz</span>
            </div>
          </div>

          {/* One-line health advice */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: band.surfaceTint,
              borderColor: band.borderTint,
            }}
          >
            <p className={`text-sm sm:text-base font-medium leading-relaxed ${band.textClass}`}>
              {band.oneLineAdvice}
            </p>
          </div>
        </div>

        {/* Right: PM2.5, PM10, Cigarette Equivalence, and 3-Day Outlook */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6 lg:border-l lg:border-[#E6ECE9] lg:pl-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#F7FAF8] border border-[#E2E9E5] p-4 flex flex-col justify-between gap-3">
              <div className="text-xs font-medium text-[#42534C]">Fine Particles · PM2.5</div>
              <div>
                <div
                  data-testid="live-pm25-value"
                  className="font-mono text-3xl sm:text-4xl font-bold text-[#111C18] tabular-nums"
                >
                  {data.current.pm25}
                </div>
                <div className="text-xs text-[#4A5B54] mt-0.5">µg/m³</div>
              </div>
              <div className="text-xs text-[#42534C] leading-snug pt-2 border-t border-[#E2E9E5]">
                {getWhoPm25Ratio(data.current.pm25)}
              </div>
            </div>

            <div className="rounded-xl bg-[#F7FAF8] border border-[#E2E9E5] p-4 flex flex-col justify-between gap-3">
              <div className="text-xs font-medium text-[#42534C]">Coarse Dust · PM10</div>
              <div>
                <div
                  data-testid="live-pm10-value"
                  className="font-mono text-3xl sm:text-4xl font-bold text-[#111C18] tabular-nums"
                >
                  {data.current.pm10}
                </div>
                <div className="text-xs text-[#4A5B54] mt-0.5">µg/m³</div>
              </div>
              <div className="text-xs text-[#42534C] leading-snug pt-2 border-t border-[#E2E9E5]">
                {getWhoPm10Ratio(data.current.pm10)}
              </div>
            </div>
          </div>

          {/* Today's air = X cigarettes card (Berkeley Earth: PM2.5 / 22) */}
          <div
            data-testid="cigarette-equivalent-card"
            className="rounded-xl bg-[#FAF9F6] border border-[#E6E0D6] p-4 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm sm:text-base font-display font-bold text-[#111C18]">
                <Cigarette className="w-4 h-4 text-[#8C4A27] shrink-0" aria-hidden="true" />
                <span className="tabular-nums">{cigaretteInfo.headline}</span>
              </div>
              <span className="text-[11px] font-mono text-[#595048] whitespace-nowrap shrink-0 tabular-nums">
                PM2.5 ÷ 22
              </span>
            </div>
            <p className="text-xs text-[#453D36] leading-relaxed">
              {cigaretteInfo.healthMeaning}
            </p>
            <p className="text-[11px] text-[#595048]">
              Berkeley Earth 24h equivalence (1 cigarette ≈ 22 µg/m³ PM2.5)
            </p>
          </div>

          {/* 3-Day Forecast Outlook */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#111C18]">3-Day AQI Outlook</h2>
              <span className="text-xs text-[#4A5B54]">Min / Max US AQI</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {data.days.map((day, idx) => {
                const dayBand = getAqiBand(day.avgAqi);
                const isSelected = idx === selectedDayIndex;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => onSelectDay(idx)}
                    aria-pressed={isSelected}
                    aria-label={`${day.label} ${day.shortDate}, AQI ${day.minAqi} to ${day.maxAqi}, average ${day.avgAqi}, ${dayBand.label}`}
                    className={`rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EEF5F2] border-[#0F5E4A]'
                        : 'bg-white border-[#E2E9E5] hover:border-[#B6C7C0]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#111C18] truncate">
                      {day.label}
                    </div>
                    <div className="text-[11px] text-[#4A5B54]">{day.shortDate}</div>
                    <div
                      className="mt-1.5 font-mono text-sm font-bold tabular-nums"
                      style={{ color: dayBand.colorHex }}
                    >
                      {day.minAqi}–{day.maxAqi}
                    </div>
                    <div className="text-[11px] font-medium text-[#42534C] truncate mt-0.5">
                      Avg {day.avgAqi} · {dayBand.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

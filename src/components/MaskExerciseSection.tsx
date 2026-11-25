import { Activity, Shield } from 'lucide-react';
import { getAqiBand, type TimeWindowSummary } from '../utils/aqi';

interface MaskExerciseSectionProps {
  cityName: string;
  cityHindiName: string;
  currentAqi: number;
  bestWindow: TimeWindowSummary | null;
}

export function MaskExerciseSection({
  cityName,
  cityHindiName,
  currentAqi,
  bestWindow,
}: MaskExerciseSectionProps) {
  const band = getAqiBand(currentAqi);

  return (
    <section
      id="mask-exercise"
      aria-labelledby="mask-exercise-heading"
      className="rounded-2xl bg-white border border-[#DCE4E0] p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E8EEEC] pb-5">
        <div>
          <h2
            id="mask-exercise-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C18]"
          >
            Mask & outdoor-exercise advice
          </h2>
          <p className="text-sm text-[#52605B] mt-1">
            Tailored for {cityName}{' '}
            {cityHindiName !== cityName && <span lang="hi">({cityHindiName})</span>} at today’s live AQI{' '}
            <span className="font-mono font-semibold tabular-nums text-[#111C18]">{currentAqi}</span>{' '}
            <span aria-hidden="true">·</span>{' '}
            <span style={{ color: band.colorHex }} className="font-semibold">
              {band.label}
            </span>
          </p>
        </div>

        {bestWindow && (
          <div className="text-xs sm:text-sm text-[#4A5B54]">
            Cleanest outdoor slot:{' '}
            <span className="font-mono font-semibold text-[#111C18] tabular-nums">
              {bestWindow.rangeLabel}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mask Guidance */}
        <article className="rounded-xl bg-[#FAFDFC] border border-[#E1E8E4] p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#0F5E4A] shrink-0" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-[#111C18]">
                Mask Guidance
              </h3>
            </div>
            <span
              className="text-xs font-semibold whitespace-nowrap shrink-0"
              style={{ color: band.colorHex }}
            >
              {band.maskGrade}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-base font-semibold text-[#111C18]">{band.maskTitle}</p>
            <p className="text-sm text-[#4A5B54] leading-relaxed">{band.maskGuidance}</p>
            <p className="text-xs text-[#245940] leading-relaxed pt-1">
              <strong className="font-semibold">Why this helps:</strong> {band.maskWhyHelps}
            </p>
          </div>

          <ul className="space-y-2 pt-3 border-t border-[#E8EEEC] text-sm text-[#35463F]">
            {band.maskPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="text-[#0F5E4A] font-bold">
                  –
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* Outdoor Exercise Guidance */}
        <article className="rounded-xl bg-[#FAFDFC] border border-[#E1E8E4] p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-[#0F5E4A] shrink-0" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-[#111C18]">
                Outdoor Exercise & Commute
              </h3>
            </div>
            <span
              className="text-xs font-semibold whitespace-nowrap shrink-0"
              style={{ color: band.colorHex }}
            >
              {band.exerciseIntensity}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-base font-semibold text-[#111C18]">{band.exerciseTitle}</p>
            <p className="text-sm text-[#4A5B54] leading-relaxed">{band.exerciseGuidance}</p>
            <p className="text-xs text-[#245940] leading-relaxed pt-1">
              <strong className="font-semibold">Why this helps:</strong> {band.exerciseWhyHelps}
            </p>
          </div>

          <ul className="space-y-2 pt-3 border-t border-[#E8EEEC] text-sm text-[#35463F]">
            {band.exercisePoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="text-[#0F5E4A] font-bold">
                  –
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Home,
  Leaf,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Square,
  User,
  Users,
  Volume2,
} from 'lucide-react';
import type { IndianCity } from '../data/cities';
import {
  formatHourlyForecastForPrompt,
  type LiveAirQualityData,
  type TimeWindowSummary,
} from '../utils/aqi';
import {
  BREATHING_ISSUE_OPTIONS,
  buildHindiPlanSpeechText,
  COMMUTE_OPTIONS,
  HOME_TYPE_OPTIONS,
  validateFamilyProfile,
  type CommuteType,
  type FamilyProfile,
  type HomeType,
  type PersonalizedFamilyPlan,
} from '../utils/familyPlan';

interface FamilyPlanSectionProps {
  city: IndianCity;
  airQuality: LiveAirQualityData | null;
  bestWindow: TimeWindowSummary | null;
  worstWindow: TimeWindowSummary | null;
  profile: FamilyProfile;
  onChangeProfile: (next: FamilyProfile) => void;
  plan: PersonalizedFamilyPlan | null;
  onPlanGenerated: (plan: PersonalizedFamilyPlan) => void;
}

export function FamilyPlanSection({
  city,
  airQuality,
  bestWindow,
  worstWindow,
  profile,
  onChangeProfile,
  plan,
  onPlanGenerated,
}: FamilyPlanSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'memberCount' | 'ages', string>>
  >({});
  const [isSpeakingHindi, setIsSpeakingHindi] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const memberCountId = useId();
  const agesId = useId();
  const commuteId = useId();
  const homeTypeId = useId();
  const notesId = useId();

  const stopHindiSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingHindi(false);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Stop active speech if the plan changes or city changes
    stopHindiSpeech();
  }, [plan?.generatedAt]);

  const handleListenInHindi = () => {
    if (!plan) return;
    setSpeechNotice(null);

    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setSpeechNotice('Speech playback is not supported in this browser.');
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const speechText = buildHindiPlanSpeechText(plan);
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;

    const voices = synth.getVoices();
    const hindiVoice =
      voices.find((v) => v.lang.toLowerCase() === 'hi-in') ??
      voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onend = () => {
      setIsSpeakingHindi(false);
    };
    utterance.onerror = (event) => {
      setIsSpeakingHindi(false);
      if (
        event.error &&
        event.error !== 'canceled' &&
        event.error !== 'interrupted'
      ) {
        setSpeechNotice(
          'Hindi speech playback is unavailable on this browser/device.'
        );
      }
    };

    setIsSpeakingHindi(true);
    synth.speak(utterance);
  };

  const toggleBreathingIssue = (issue: string) => {
    const exists = profile.breathingIssues.includes(issue);
    const next = exists
      ? profile.breathingIssues.filter((item) => item !== issue)
      : [...profile.breathingIssues, issue];
    onChangeProfile({ ...profile, breathingIssues: next });
  };

  const generatePlan = async () => {
    setApiError(null);

    const validation = validateFamilyProfile(profile);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      return;
    }

    if (!airQuality) {
      setApiError(
        'Live air quality data is still loading. Please wait a moment and try again.'
      );
      return;
    }

    const hourlyForecastText = formatHourlyForecastForPrompt(airQuality.days);

    try {
      setIsGenerating(true);
      const response = await fetch('/api/family-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: {
            name: city.name,
            hindiName: city.hindiName,
            state: city.state,
          },
          airQuality: {
            usAqi: airQuality.current.usAqi,
            pm25: airQuality.current.pm25,
            pm10: airQuality.current.pm10,
            bestWindowLabel: bestWindow?.rangeLabel ?? null,
            bestWindowAvgAqi: bestWindow?.avgAqi ?? null,
            worstWindowLabel: worstWindow?.rangeLabel ?? null,
            worstWindowAvgAqi: worstWindow?.avgAqi ?? null,
            hourlyForecastText,
          },
          familyProfile: profile,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        plan?: PersonalizedFamilyPlan;
        error?: string;
      };

      if (!response.ok || !payload.plan) {
        throw new Error(
          payload.error ||
            'We couldn’t create your family plan right now. Please try again in a moment.'
        );
      }

      onPlanGenerated(payload.plan);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Something went wrong while contacting Gemini. Please try again.';
      setApiError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generatePlan();
  };

  const isPlanForDifferentCity =
    plan !== null && plan.cityName.toLowerCase() !== city.name.toLowerCase();

  return (
    <section
      id="family-plan"
      aria-labelledby="family-plan-heading"
      className="rounded-2xl bg-white border border-[#DCE4E0] p-6 sm:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8EEEC] pb-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0F5E4A] mb-1.5">
            <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Personalized Per-Member Planner · Powered by Gemini</span>
          </div>
          <h2
            id="family-plan-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C18]"
          >
            My Family Daily Air Plan
          </h2>
          <p className="text-sm text-[#52605B] mt-1.5 leading-relaxed">
            Enter your family details below. Gemini combines today’s live AQI and hourly forecast in{' '}
            {city.name}{' '}
            {city.hindiName !== city.name && <span lang="hi">({city.hindiName})</span>} to build an
            individual plan for <strong>each member</strong>—covering best hours, low-emission
            routine, indoor air hacks, mask & exercise advice, and why each step helps.
          </p>
        </div>

        {airQuality && (
          <div className="text-sm text-[#4A5B54] shrink-0">
            Using live forecast: <span className="font-semibold text-[#111C18]">{city.name}</span>{' '}
            <span aria-hidden="true">·</span>{' '}
            <span className="font-mono font-semibold tabular-nums text-[#111C18]">
              AQI {airQuality.current.usAqi}
            </span>
          </div>
        )}
      </div>

      {/* My Family Profile Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Number of people */}
          <div>
            <label
              htmlFor={memberCountId}
              className="block text-sm font-medium text-[#111C18] mb-1.5"
            >
              Number of people
            </label>
            <input
              id={memberCountId}
              type="number"
              min={1}
              max={15}
              value={profile.memberCount}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                onChangeProfile({
                  ...profile,
                  memberCount: Number.isNaN(parsed) ? 0 : parsed,
                });
                setFieldErrors((prev) => ({ ...prev, memberCount: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.memberCount)}
              className="w-full h-11 px-3.5 rounded-lg bg-[#F9FBFA] border border-[#D4DDD8] text-sm font-mono tabular-nums text-[#111C18] focus:bg-white focus:border-[#0F5E4A]"
            />
            {fieldErrors.memberCount && (
              <p className="mt-1.5 text-xs text-[#B91C1C]" role="alert">
                {fieldErrors.memberCount}
              </p>
            )}
          </div>

          {/* Ages */}
          <div>
            <label
              htmlFor={agesId}
              className="block text-sm font-medium text-[#111C18] mb-1.5"
            >
              Ages of members
            </label>
            <input
              id={agesId}
              type="text"
              value={profile.ages}
              onChange={(e) => {
                onChangeProfile({ ...profile, ages: e.target.value });
                setFieldErrors((prev) => ({ ...prev, ages: undefined }));
              }}
              placeholder="e.g., 8, 36, 39, 68"
              aria-invalid={Boolean(fieldErrors.ages)}
              className="w-full h-11 px-3.5 rounded-lg bg-[#F9FBFA] border border-[#D4DDD8] text-sm text-[#111C18] placeholder:text-[#52635C] focus:bg-white focus:border-[#0F5E4A]"
            />
            {fieldErrors.ages ? (
              <p className="mt-1.5 text-xs text-[#B91C1C]" role="alert">
                {fieldErrors.ages}
              </p>
            ) : (
              <p className="mt-1 text-xs text-[#4A5B54]">
                One personalized card is generated per age
              </p>
            )}
          </div>

          {/* Commute type */}
          <div>
            <label
              htmlFor={commuteId}
              className="block text-sm font-medium text-[#111C18] mb-1.5"
            >
              Primary commute type
            </label>
            <select
              id={commuteId}
              value={profile.commuteType}
              onChange={(e) =>
                onChangeProfile({
                  ...profile,
                  commuteType: e.target.value as CommuteType,
                })
              }
              className="w-full h-11 px-3 rounded-lg bg-[#F9FBFA] border border-[#D4DDD8] text-sm text-[#111C18] focus:bg-white focus:border-[#0F5E4A]"
            >
              {COMMUTE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Home type */}
          <div>
            <label
              htmlFor={homeTypeId}
              className="block text-sm font-medium text-[#111C18] mb-1.5"
            >
              Home type
            </label>
            <select
              id={homeTypeId}
              value={profile.homeType}
              onChange={(e) =>
                onChangeProfile({
                  ...profile,
                  homeType: e.target.value as HomeType,
                })
              }
              className="w-full h-11 px-3 rounded-lg bg-[#F9FBFA] border border-[#D4DDD8] text-sm text-[#111C18] focus:bg-white focus:border-[#0F5E4A]"
            >
              {HOME_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Household groups & breathing conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
          <fieldset className="lg:col-span-4 space-y-2.5">
            <legend className="text-sm font-medium text-[#111C18]">
              Kids or elderly at home
            </legend>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg border border-[#D4DDD8] bg-[#F9FBFA] hover:bg-[#F1F6F3] cursor-pointer text-sm text-[#111C18]">
                <input
                  type="checkbox"
                  checked={profile.hasKids}
                  onChange={(e) =>
                    onChangeProfile({ ...profile, hasKids: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#0F5E4A] rounded"
                />
                <span>Kids (under 12)</span>
              </label>

              <label className="inline-flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg border border-[#D4DDD8] bg-[#F9FBFA] hover:bg-[#F1F6F3] cursor-pointer text-sm text-[#111C18]">
                <input
                  type="checkbox"
                  checked={profile.hasElderly}
                  onChange={(e) =>
                    onChangeProfile({ ...profile, hasElderly: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#0F5E4A] rounded"
                />
                <span>Elderly (60+)</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="lg:col-span-8 space-y-2.5">
            <legend className="text-sm font-medium text-[#111C18]">
              Asthma or breathing sensitivities
            </legend>
            <div className="flex flex-wrap gap-2">
              {BREATHING_ISSUE_OPTIONS.map((issue) => {
                const selected = profile.breathingIssues.includes(issue);
                return (
                  <button
                    key={issue}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleBreathingIssue(issue)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-[#0F5E4A] text-white border-[#0F5E4A]'
                        : 'bg-[#F9FBFA] text-[#2B3B34] border-[#D4DDD8] hover:border-[#0F5E4A]/50'
                    }`}
                  >
                    {issue}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Optional notes + Submit */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-[#EDF2F0]">
          <div className="flex-1 max-w-xl">
            <label
              htmlFor={notesId}
              className="block text-sm font-medium text-[#111C18] mb-1.5"
            >
              Optional note (inhaler use, school timings, purifier available)
            </label>
            <input
              id={notesId}
              type="text"
              value={profile.breathingNotes}
              onChange={(e) =>
                onChangeProfile({ ...profile, breathingNotes: e.target.value })
              }
              placeholder="e.g., 8-year-old has morning school bus at 7:30 AM; 1 HEPA purifier in bedroom"
              className="w-full h-11 px-3.5 rounded-lg bg-[#F9FBFA] border border-[#D4DDD8] text-sm text-[#111C18] placeholder:text-[#52635C] focus:bg-white focus:border-[#0F5E4A]"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating || !airQuality}
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0F5E4A] text-white text-sm font-semibold hover:bg-[#0B4A3A] active:scale-[0.98] disabled:opacity-60 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>Building Member Plans...</span>
              </>
            ) : (
              <span>{plan ? 'Regenerate Family Plan' : 'Generate Family Plan'}</span>
            )}
          </button>
        </div>
      </form>

      {/* Friendly Error Message with Retry */}
      {apiError && (
        <div
          role="alert"
          className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-[#991B1B]"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">Couldn’t generate your family plan just now</p>
              <p className="mt-0.5 text-[#7F1D1D]">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={generatePlan}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#991B1B] text-white text-xs font-semibold hover:bg-[#7F1D1D] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Loading State while Gemini builds individual member plans */}
      {isGenerating && (
        <div
          aria-busy="true"
          aria-label="Generating personalized air plans for each family member"
          className="space-y-4 pt-2"
        >
          <div className="rounded-xl bg-[#F2F8F5] border border-[#CDE1D7] p-4 flex items-center gap-3 text-sm text-[#0F5E4A] font-medium">
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none shrink-0" aria-hidden="true" />
            <span>
              Analyzing today’s and tomorrow’s hourly AQI in {city.name} to build individual plans for your family...
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse motion-reduce:animate-none">
            <div className="h-80 rounded-xl bg-[#F4F8F6] border border-[#E5ECE8]" />
            <div className="h-80 rounded-xl bg-[#F4F8F6] border border-[#E5ECE8]" />
          </div>
        </div>
      )}

      {/* Generated Per-Member AI Plan Cards */}
      {plan && !isGenerating && (
        <div
          data-testid="ai-family-plan-cards"
          className="space-y-6 pt-2 scroll-mt-24"
        >
          {isPlanForDifferentCity && (
            <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#854D0E]">
              <span>
                This plan was generated for <strong>{plan.cityName}</strong> (AQI{' '}
                {plan.aqiAtGeneration}). Refresh it for <strong>{city.name}</strong> to match
                local hourly air quality.
              </span>
              <button
                type="button"
                onClick={generatePlan}
                className="inline-flex items-center gap-1.5 font-semibold underline cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Update for {city.name}</span>
              </button>
            </div>
          )}

          {/* Household Summary Strip + Listen in Hindi Audio Controls */}
          <div className="rounded-xl bg-[#F2F8F5] border border-[#CDE1D7] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#0F5E4A]">
                {plan.cityName}{' '}
                {plan.cityHindiName !== plan.cityName && (
                  <span lang="hi">({plan.cityHindiName})</span>
                )}{' '}
                <span aria-hidden="true">·</span> Live AQI {plan.aqiAtGeneration}{' '}
                <span aria-hidden="true">·</span> {plan.householdRiskLevel}{' '}
                <span aria-hidden="true">·</span> {plan.memberPlans.length}{' '}
                {plan.memberPlans.length === 1 ? 'member plan' : 'member plans'}
              </div>
              <h3 className="font-display text-xl font-bold text-[#111C18]">
                {plan.headline}
              </h3>
              {plan.householdWhyThisHelps && (
                <p className="text-xs sm:text-sm text-[#24503B]">
                  <strong className="font-semibold">Why this helps:</strong>{' '}
                  {plan.householdWhyThisHelps}
                </p>
              )}
              {speechNotice && (
                <p role="status" className="text-xs text-[#991B1B]">
                  {speechNotice}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleListenInHindi}
                aria-pressed={isSpeakingHindi}
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-[#0F5E4A] text-white text-sm font-medium hover:bg-[#0B4A3A] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isSpeakingHindi ? 'Reading in Hindi...' : 'Listen in Hindi'}</span>
              </button>

              <button
                type="button"
                onClick={stopHindiSpeech}
                disabled={!isSpeakingHindi}
                aria-label="Stop reading Hindi plan"
                className={`inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isSpeakingHindi
                    ? 'bg-white border border-[#B91C1C]/50 text-[#991B1B] hover:bg-[#FEF2F2] active:scale-[0.98] cursor-pointer'
                    : 'bg-white/80 border border-[#D4DDD8] text-[#52635C] cursor-not-allowed'
                }`}
              >
                <Square className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                <span>Stop</span>
              </button>
            </div>
          </div>

          {/* Individual Plan Card Per Family Member */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plan.memberPlans.map((member, idx) => (
              <article
                key={`${member.memberLabel}-${idx}`}
                data-testid="member-plan-card"
                className="rounded-xl bg-[#FAFDFC] border border-[#DCE4E0] p-5 sm:p-6 flex flex-col gap-5"
              >
                {/* Member Header */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3.5 border-b border-[#E5ECE8]">
                  <div className="flex items-center gap-2.5">
                    <User className="w-5 h-5 text-[#0F5E4A] shrink-0" aria-hidden="true" />
                    <h4 className="font-display text-lg font-bold text-[#111C18]">
                      {member.memberLabel}
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-[#4A5B54]">
                    {member.riskTag}
                  </span>
                </div>

                {/* 1. Best Hours to Go Out */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F5E4A]">
                      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Best hours to go out</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-[#14532D] tabular-nums">
                      {member.bestHours.recommendedWindow}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#9F1D1D] tabular-nums">
                    Avoid: {member.bestHours.avoidWindow}
                  </p>
                  <p className="text-sm text-[#1F2E28] leading-relaxed">
                    {member.bestHours.guidance}
                  </p>
                  <p className="text-xs text-[#2B5A42] leading-relaxed">
                    <strong className="font-semibold">Why this helps:</strong>{' '}
                    {member.bestHours.whyThisHelps}
                  </p>
                </div>

                {/* 2. Low-Emission Daily Routine */}
                <div className="space-y-1.5 pt-4 border-t border-[#EAEFEE]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5E4A]">
                    <Leaf className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Low-emission daily routine</span>
                  </div>
                  <p className="text-sm font-semibold text-[#111C18]">
                    {member.lowEmissionRoutine.title}
                  </p>
                  <p className="text-sm text-[#42534C] leading-relaxed">
                    {member.lowEmissionRoutine.detail}
                  </p>
                  <p className="text-xs text-[#2B5A42] leading-relaxed">
                    <strong className="font-semibold">Why this helps:</strong>{' '}
                    {member.lowEmissionRoutine.whyThisHelps}
                  </p>
                </div>

                {/* 3. Indoor Air Hack */}
                <div className="space-y-1.5 pt-4 border-t border-[#EAEFEE]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5E4A]">
                    <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Indoor air hack</span>
                  </div>
                  <p className="text-sm font-semibold text-[#111C18]">
                    {member.indoorAirHack.title}
                  </p>
                  <p className="text-sm text-[#42534C] leading-relaxed">
                    {member.indoorAirHack.detail}
                  </p>
                  <p className="text-xs text-[#2B5A42] leading-relaxed">
                    <strong className="font-semibold">Why this helps:</strong>{' '}
                    {member.indoorAirHack.whyThisHelps}
                  </p>
                </div>

                {/* 4. Mask & Exercise Advice */}
                <div className="space-y-1.5 pt-4 border-t border-[#EAEFEE]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F5E4A]">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Mask & exercise advice</span>
                    </span>
                    <span className="text-xs font-semibold text-[#111C18]">
                      {member.maskAndExercise.maskType}
                    </span>
                  </div>
                  <p className="text-xs text-[#52635C]">
                    When to mask: {member.maskAndExercise.maskWhen}
                  </p>
                  <p className="text-sm text-[#42534C] leading-relaxed">
                    {member.maskAndExercise.exerciseGuidance}
                  </p>
                  <p className="text-xs text-[#2B5A42] leading-relaxed">
                    <strong className="font-semibold">Why this helps:</strong>{' '}
                    {member.maskAndExercise.whyThisHelps}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

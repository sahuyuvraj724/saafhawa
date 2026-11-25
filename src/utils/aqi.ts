import type { IndianCity } from '../data/cities';

export type AqiBandKey =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous';

export interface AqiBandInfo {
  key: AqiBandKey;
  label: string;
  hindiLabel: string;
  range: string;
  min: number;
  max: number;
  colorHex: string;
  surfaceTint: string;
  borderTint: string;
  textClass: string;
  barClass: string;
  oneLineAdvice: string;
  maskTitle: string;
  maskGrade: string;
  maskGuidance: string;
  maskWhyHelps: string;
  maskPoints: string[];
  exerciseTitle: string;
  exerciseIntensity: string;
  exerciseGuidance: string;
  exerciseWhyHelps: string;
  exercisePoints: string[];
}

export const AQI_BANDS: AqiBandInfo[] = [
  {
    key: 'good',
    label: 'Good',
    hindiLabel: 'अच्छी हवा',
    range: '0–50',
    min: 0,
    max: 50,
    colorHex: '#15803D',
    surfaceTint: '#ECFDF3',
    borderTint: '#BBF7D0',
    textClass: 'text-[#14532D]',
    barClass: 'bg-[#15803D]',
    oneLineAdvice: 'Clean air across the city—ideal for open windows, walking, and outdoor exercise.',
    maskTitle: 'No mask required',
    maskGrade: 'None needed',
    maskGuidance: 'Ambient particulate levels are low. Breathable outdoor air needs no respiratory filtration.',
    maskWhyHelps: 'Keeps breathing effortless while natural nasal filtration easily handles low background particle levels.',
    maskPoints: [
      'Leave masks off for routine commutes and morning walks.',
      'Only carry a light mask if passing active road construction or dusty flyovers.',
    ],
    exerciseTitle: 'Full outdoor activity',
    exerciseIntensity: 'Unrestricted',
    exerciseGuidance: 'Great conditions for running, cycling, parks, and school sports at any hour.',
    exerciseWhyHelps: 'Deep aerobic breathing in clean air boosts cardiovascular health without inhaling harmful fine particulates.',
    exercisePoints: [
      'Normal aerobic and high-intensity outdoor workouts are safe.',
      'Open windows generously to refresh indoor air throughout the day.',
    ],
  },
  {
    key: 'moderate',
    label: 'Moderate',
    hindiLabel: 'मध्यम',
    range: '51–100',
    min: 51,
    max: 100,
    colorHex: '#8F5405',
    surfaceTint: '#FEFCE8',
    borderTint: '#FDE68A',
    textClass: 'text-[#713F12]',
    barClass: 'bg-[#CA8A04]',
    oneLineAdvice: 'Acceptable for most people; asthma and dust-sensitive individuals should skip heavy roadside exertion.',
    maskTitle: 'Optional for sensitive commuters',
    maskGrade: 'Optional N95 on traffic routes',
    maskGuidance: 'Most people do not need a mask, though two-wheeler riders and asthma patients benefit near heavy traffic.',
    maskWhyHelps: 'Filters roadside diesel soot and coarse dust bursts that trigger coughing or sinus flare-ups in sensitive airways.',
    maskPoints: [
      'Keep an N95 handy if commuting by scooter/bike on arterial roads.',
      'Sensitive lungs should wear a snug mask near construction dust.',
    ],
    exerciseTitle: 'Outdoor exercise okay; pick green zones',
    exerciseIntensity: 'Moderate to Vigorous',
    exerciseGuidance: 'Normal walks and runs are fine, especially inside parks away from busy junctions.',
    exerciseWhyHelps: 'Exercising 100+ meters away from main roads cuts inhaled vehicle exhaust while preserving daily fitness.',
    exercisePoints: [
      'Favor the day’s lowest-AQI window for long endurance runs.',
      'People with asthma should keep a reliever inhaler nearby and watch for coughing.',
    ],
  },
  {
    key: 'sensitive',
    label: 'Unhealthy for Sensitive',
    hindiLabel: 'संवेदनशील समूहों के लिए अस्वस्थ',
    range: '101–150',
    min: 101,
    max: 150,
    colorHex: '#C2410C',
    surfaceTint: '#FFF7ED',
    borderTint: '#FED7AA',
    textClass: 'text-[#9A3412]',
    barClass: 'bg-[#EA580C]',
    oneLineAdvice: 'Children, seniors, and anyone with asthma should shorten outdoor stays and avoid busy roads.',
    maskTitle: 'N95 / KN95 recommended outdoors',
    maskGrade: 'N95 / FFP2 for commutes',
    maskGuidance: 'Fine PM2.5 penetrates cloth and loose surgical masks; switch to a snug N95 for outdoor commutes.',
    maskWhyHelps: 'Electrostatic N95 media captures over 95% of PM2.5 particles before they reach small airways and bloodstream.',
    maskPoints: [
      'Press the nose bridge firmly so exhaled air does not leak near your eyes.',
      'Mandatory for children, seniors, and pregnant or asthmatic individuals outside.',
    ],
    exerciseTitle: 'Light outdoor movement only',
    exerciseIntensity: 'Low to Moderate',
    exerciseGuidance: 'Avoid intense outdoor running or cycling; shift strenuous cardio indoors or to today’s cleanest window.',
    exerciseWhyHelps: 'Lower breathing rates reduce total PM2.5 dose inhaled per minute and prevent airway inflammation.',
    exercisePoints: [
      'Swap fast intervals for brisk walking in sheltered parks during peak afternoon dispersion.',
      'Avoid early-morning roadside jogs when winter/urban inversion traps exhaust.',
    ],
  },
  {
    key: 'unhealthy',
    label: 'Unhealthy',
    hindiLabel: 'अस्वस्थ',
    range: '151–200',
    min: 151,
    max: 200,
    colorHex: '#B91C1C',
    surfaceTint: '#FEF2F2',
    borderTint: '#FECACA',
    textClass: 'text-[#991B1B]',
    barClass: 'bg-[#DC2626]',
    oneLineAdvice: 'Everyone may feel throat or eye irritation—wear an N95 mask outside and move workouts indoors.',
    maskTitle: 'Wear a sealed N95 / FFP2 mask',
    maskGrade: 'N95 / FFP2 Required',
    maskGuidance: 'Every adult and child over 2 years should wear a fitted particulate respirator whenever outdoors.',
    maskWhyHelps: 'A proper facial seal prevents unfiltered smog from bypassing the filter edges, slashing throat irritation and PM2.5 intake.',
    maskPoints: [
      'Avoid cloth masks or handkerchiefs—they block less than 20% of PM2.5.',
      'Replace N95 filters once breathing resistance rises or after 30–40 hours of smog exposure.',
    ],
    exerciseTitle: 'Move all cardio workouts indoors',
    exerciseIntensity: 'Indoor Only',
    exerciseGuidance: 'Deep breathing during outdoor runs pulls 5–10× more PM2.5 deep into the lungs. Train indoors today.',
    exerciseWhyHelps: 'Indoor training avoids mouth-breathing heavy smog that bypasses nasal filtration and aggravates lungs.',
    exercisePoints: [
      'Choose indoor yoga, strength training, or home bodyweight circuits instead of outdoor jogging.',
      'If you must walk outside, keep it brief, slow, and strictly within today’s lowest-AQI window.',
    ],
  },
  {
    key: 'very-unhealthy',
    label: 'Very Unhealthy',
    hindiLabel: 'बहुत अस्वस्थ',
    range: '201–300',
    min: 201,
    max: 300,
    colorHex: '#7E22CE',
    surfaceTint: '#FAF5FF',
    borderTint: '#E9D5FF',
    textClass: 'text-[#6B21A8]',
    barClass: 'bg-[#9333EA]',
    oneLineAdvice: 'Health alert: skip non-essential outdoor trips, keep windows closed, and wear a tight N95/N99 outside.',
    maskTitle: 'Strict N95 / N99 respirator outside',
    maskGrade: 'N95 / N99 Mandatory',
    maskGuidance: 'High particulate load affects healthy lungs quickly. Use a tight-seal N95 or N99 respirator for any outdoor step.',
    maskWhyHelps: 'Head-strap respirators maintain an airtight seal during dense haze, protecting even healthy lungs from acute oxidative stress.',
    maskPoints: [
      'Choose head-strap N95/N99 masks over loose ear-loops for a gap-free facial seal.',
      'Check mask fit before stepping out; minimize total time spent waiting on open roads.',
    ],
    exerciseTitle: 'Cancel outdoor exercise completely',
    exerciseIntensity: 'Zero Outdoor Exertion',
    exerciseGuidance: 'Zero outdoor running, cycling, or sports. Even light outdoor exertion spikes respiratory inflammation.',
    exerciseWhyHelps: 'Resting from outdoor exertion prevents sharp spikes in blood pressure, wheezing, and lingering smog cough.',
    exercisePoints: [
      'Keep children’s play and senior walks strictly indoors with filtered or sealed air.',
      'Stick to gentle indoor mobility, stretching, or low-dust home workouts.',
    ],
  },
  {
    key: 'hazardous',
    label: 'Hazardous',
    hindiLabel: 'खतरनाक',
    range: '301+',
    min: 301,
    max: 500,
    colorHex: '#881337',
    surfaceTint: '#FFF1F2',
    borderTint: '#FECDD3',
    textClass: 'text-[#881337]',
    barClass: 'bg-[#9F1239]',
    oneLineAdvice: 'Severe air emergency—stay indoors with windows sealed and use a well-fitted N95/N99 if going out is unavoidable.',
    maskTitle: 'Emergency N95 / N99 protection',
    maskGrade: 'N99 / Sealed N95 Only',
    maskGuidance: 'Severe smog conditions. Step outdoors only for essential reasons wearing a tight-fitting N95 or N99 respirator.',
    maskWhyHelps: 'High-efficiency N99/N95 filtration blocks hazardous fine particulates during brief unavoidable trips outside.',
    maskPoints: [
      'Do not remove your mask while walking between metro exits, parking lots, and buildings.',
      'Wear wraparound glasses if eyes sting from heavy haze and rinse face upon returning.',
    ],
    exerciseTitle: 'Rest indoors; avoid heavy exertion',
    exerciseIntensity: 'Indoor Rest / Gentle Mobility',
    exerciseGuidance: 'Suspend all outdoor physical activity and avoid intense indoor cardio unless air is actively HEPA-purified.',
    exerciseWhyHelps: 'Minimizing breathing volume during hazardous air prevents acute asthma attacks and cardiovascular strain.',
    exercisePoints: [
      'Keep doors, windows, and balcony vents tightly closed around the clock.',
      'Hydrate well and monitor elderly family members or children for wheezing or chest tightness.',
    ],
  },
];

export function getAqiBand(aqi: number): AqiBandInfo {
  const safeAqi = Number.isFinite(aqi) ? Math.max(0, Math.round(aqi)) : 0;
  for (const band of AQI_BANDS) {
    if (safeAqi >= band.min && safeAqi <= band.max) {
      return band;
    }
  }
  return AQI_BANDS[AQI_BANDS.length - 1];
}

export interface HourlyPoint {
  time: string; // YYYY-MM-DDTHH:MM
  dateKey: string; // YYYY-MM-DD
  hour: number; // 0..23
  usAqi: number;
  pm25: number;
}

export interface DayForecastSummary {
  dateKey: string;
  label: string;
  shortDate: string;
  minAqi: number;
  maxAqi: number;
  avgAqi: number;
  hourly: HourlyPoint[];
}

export interface TimeWindowSummary {
  startHour: number;
  endHour: number; // exclusive hour for display range e.g. 13..16 => "1 PM – 4 PM"
  avgAqi: number;
  avgPm25: number;
  rangeLabel: string;
}

export interface LiveAirQualityData {
  city: IndianCity;
  fetchedAt: string;
  timezone: string;
  isFallback?: boolean;
  current: {
    time: string;
    usAqi: number;
    pm25: number;
    pm10: number;
  };
  days: DayForecastSummary[];
}

export interface OpenMeteoAirQualityResponse {
  timezone?: string;
  current?: {
    time: string;
    us_aqi: number | null;
    pm2_5: number | null;
    pm10: number | null;
  };
  hourly?: {
    time: string[];
    us_aqi: Array<number | null>;
    pm2_5: Array<number | null>;
  };
}

export function formatHourLabel(hour24: number): string {
  const normalized = ((hour24 % 24) + 24) % 24;
  if (normalized === 0) return '12 AM';
  if (normalized === 12) return '12 PM';
  if (normalized < 12) return `${normalized} AM`;
  return `${normalized - 12} PM`;
}

export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHourLabel(startHour)} – ${formatHourLabel(endHour)}`;
}

export function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function parseOpenMeteoResponse(
  raw: OpenMeteoAirQualityResponse,
  city: IndianCity
): LiveAirQualityData {
  const times = raw.hourly?.time ?? [];
  const aqis = raw.hourly?.us_aqi ?? [];
  const pm25s = raw.hourly?.pm2_5 ?? [];

  const points: HourlyPoint[] = [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (!t || !t.includes('T')) continue;
    const [dateKey, timePart] = t.split('T');
    const hour = Number.parseInt(timePart.slice(0, 2), 10);
    const aqiVal = aqis[i];
    const pmVal = pm25s[i];
    if (aqiVal == null || Number.isNaN(aqiVal)) continue;

    points.push({
      time: t,
      dateKey,
      hour: Number.isNaN(hour) ? 0 : hour,
      usAqi: Math.round(aqiVal),
      pm25: pmVal != null && Number.isFinite(pmVal) ? Math.round(pmVal * 10) / 10 : 0,
    });
  }

  const days = summarizeThreeDayForecast(points);

  const fallbackCurrentAqi = points[0]?.usAqi ?? 0;
  const fallbackCurrentPm25 = points[0]?.pm25 ?? 0;

  const currentAqi =
    raw.current?.us_aqi != null && Number.isFinite(raw.current.us_aqi)
      ? Math.max(0, Math.round(raw.current.us_aqi))
      : fallbackCurrentAqi;

  const currentPm25 =
    raw.current?.pm2_5 != null && Number.isFinite(raw.current.pm2_5)
      ? Math.max(0, Math.round(raw.current.pm2_5 * 10) / 10)
      : fallbackCurrentPm25;

  const currentPm10 =
    raw.current?.pm10 != null && Number.isFinite(raw.current.pm10)
      ? Math.max(0, Math.round(raw.current.pm10 * 10) / 10)
      : Math.round(currentPm25 * 1.6 * 10) / 10;

  return {
    city,
    fetchedAt: new Date().toISOString(),
    timezone: raw.timezone ?? 'Asia/Kolkata',
    current: {
      time: raw.current?.time ?? times[0] ?? new Date().toISOString(),
      usAqi: currentAqi,
      pm25: currentPm25,
      pm10: currentPm10,
    },
    days,
  };
}

export function summarizeThreeDayForecast(points: HourlyPoint[]): DayForecastSummary[] {
  const grouped = new Map<string, HourlyPoint[]>();
  for (const pt of points) {
    const list = grouped.get(pt.dateKey) ?? [];
    list.push(pt);
    grouped.set(pt.dateKey, list);
  }

  const sortedKeys = Array.from(grouped.keys()).sort().slice(0, 3);
  return sortedKeys.map((dateKey, idx) => {
    const hourly = (grouped.get(dateKey) ?? []).sort((a, b) => a.hour - b.hour);
    const aqis = hourly.map((h) => h.usAqi);
    const minAqi = aqis.length ? Math.min(...aqis) : 0;
    const maxAqi = aqis.length ? Math.max(...aqis) : 0;
    const avgAqi = aqis.length
      ? Math.round(aqis.reduce((sum, v) => sum + v, 0) / aqis.length)
      : 0;

    let label = formatShortDate(dateKey);
    if (idx === 0) label = 'Today';
    else if (idx === 1) label = 'Tomorrow';
    else if (idx === 2) {
      const [y, m, d] = dateKey.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      label = new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        timeZone: 'UTC',
      }).format(dt);
    }

    return {
      dateKey,
      label,
      shortDate: formatShortDate(dateKey),
      minAqi,
      maxAqi,
      avgAqi,
      hourly,
    };
  });
}

/**
 * Finds the best consecutive 3-hour daytime outdoor window (06:00–21:00)
 * and the worst peak 3-hour pollution window across the day.
 */
export function findBestAndWorstWindows(
  hourly: HourlyPoint[],
  windowSize = 3
): { best: TimeWindowSummary | null; worst: TimeWindowSummary | null } {
  if (!hourly.length) {
    return { best: null, worst: null };
  }

  const sorted = [...hourly].sort((a, b) => a.hour - b.hour);
  // Daytime practical outdoor hours: 6 AM through 9 PM (hours 6..21)
  const daytime = sorted.filter((h) => h.hour >= 6 && h.hour <= 21);
  const bestPool = daytime.length >= windowSize ? daytime : sorted;

  const evalWindow = (slice: HourlyPoint[]): TimeWindowSummary => {
    const avgAqi = Math.round(
      slice.reduce((sum, p) => sum + p.usAqi, 0) / slice.length
    );
    const avgPm25 =
      Math.round(
        (slice.reduce((sum, p) => sum + p.pm25, 0) / slice.length) * 10
      ) / 10;
    const startHour = slice[0].hour;
    const endHour = (slice[slice.length - 1].hour + 1) % 24;
    return {
      startHour,
      endHour,
      avgAqi,
      avgPm25,
      rangeLabel: formatHourRange(startHour, endHour),
    };
  };

  let best: TimeWindowSummary | null = null;
  if (bestPool.length < windowSize) {
    best = evalWindow(bestPool);
  } else {
    for (let i = 0; i <= bestPool.length - windowSize; i++) {
      const slice = bestPool.slice(i, i + windowSize);
      // Ensure contiguous hours when possible
      const isContiguous = slice.every(
        (pt, idx) => idx === 0 || pt.hour === slice[idx - 1].hour + 1
      );
      if (!isContiguous) continue;
      const candidate = evalWindow(slice);
      if (!best || candidate.avgAqi < best.avgAqi) {
        best = candidate;
      }
    }
    if (!best) {
      best = evalWindow(bestPool.slice(0, windowSize));
    }
  }

  let worst: TimeWindowSummary | null = null;
  if (sorted.length < windowSize) {
    worst = evalWindow(sorted);
  } else {
    for (let i = 0; i <= sorted.length - windowSize; i++) {
      const slice = sorted.slice(i, i + windowSize);
      const isContiguous = slice.every(
        (pt, idx) => idx === 0 || pt.hour === slice[idx - 1].hour + 1
      );
      if (!isContiguous) continue;
      const candidate = evalWindow(slice);
      if (!worst || candidate.avgAqi > worst.avgAqi) {
        worst = candidate;
      }
    }
    if (!worst) {
      worst = evalWindow(sorted.slice(0, windowSize));
    }
  }

  return { best, worst };
}

export function filterIndianCities(
  cities: IndianCity[],
  query: string
): IndianCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return cities.slice(0, 8);

  return cities
    .filter((city) => {
      if (city.name.toLowerCase().includes(q)) return true;
      if (city.hindiName.includes(query.trim())) return true;
      if (city.state.toLowerCase().includes(q)) return true;
      if (city.aliases?.some((a) => a.toLowerCase().includes(q))) return true;
      return false;
    })
    .slice(0, 8);
}

export function getWhoPm25Ratio(pm25: number): string {
  // WHO 24-hour guideline for PM2.5 is 15 µg/m³
  if (!Number.isFinite(pm25) || pm25 <= 0) return 'Within WHO guideline';
  const ratio = pm25 / 15;
  if (ratio <= 1) return 'Within WHO 24h limit (15 µg/m³)';
  return `${ratio.toFixed(1)}× WHO 24h limit (15 µg/m³)`;
}

export function getWhoPm10Ratio(pm10: number): string {
  // WHO 24-hour guideline for PM10 is 45 µg/m³
  if (!Number.isFinite(pm10) || pm10 <= 0) return 'Within WHO guideline';
  const ratio = pm10 / 45;
  if (ratio <= 1) return 'Within WHO 24h limit (45 µg/m³)';
  return `${ratio.toFixed(1)}× WHO 24h limit (45 µg/m³)`;
}

export function getAqiScalePercent(aqi: number): number {
  const safe = Number.isFinite(aqi) ? Math.max(0, aqi) : 0;
  // Matches the 6 equal-width color segments on the AQI scale bar
  const segments: Array<[number, number]> = [
    [0, 50],
    [50, 100],
    [100, 150],
    [150, 200],
    [200, 300],
    [300, 500],
  ];
  const segmentWidth = 100 / segments.length;

  for (let i = 0; i < segments.length; i++) {
    const [low, high] = segments[i];
    if (safe <= high || i === segments.length - 1) {
      const clamped = Math.min(safe, high);
      const frac = high > low ? (clamped - low) / (high - low) : 0;
      const pct = i * segmentWidth + frac * segmentWidth;
      return Math.max(1, Math.min(99, Math.round(pct * 10) / 10));
    }
  }
  return 99;
}

export function formatHourlyForecastForPrompt(days: DayForecastSummary[]): string {
  return days
    .slice(0, 2)
    .map((day) => {
      const { best, worst } = findBestAndWorstWindows(day.hourly, 3);
      const hoursText = day.hourly
        .map((h) => `${formatHourLabel(h.hour)}=${h.usAqi}(PM2.5:${h.pm25})`)
        .join(', ');
      return `${day.label} (${day.shortDate}, Min ${day.minAqi}–Max ${day.maxAqi}, Cleanest: ${best?.rangeLabel ?? 'N/A'} avg ${best?.avgAqi ?? 'N/A'}, Peak: ${worst?.rangeLabel ?? 'N/A'} avg ${worst?.avgAqi ?? 'N/A'}): ${hoursText}`;
    })
    .join('\n');
}

export interface CigaretteEquivalentInfo {
  cigarettesPerDay: number;
  formattedCount: string;
  headline: string;
  healthMeaning: string;
}

/**
 * Berkeley Earth equivalence: breathing 22 µg/m³ of PM2.5 over 24 hours
 * approximates the health impact of smoking 1 cigarette per day.
 */
export function calculateCigarettesPerDay(pm25: number): number {
  if (!Number.isFinite(pm25) || pm25 <= 0) return 0;
  return Math.round((pm25 / 22) * 10) / 10;
}

export function getCigaretteEquivalentInfo(pm25: number): CigaretteEquivalentInfo {
  const cigarettesPerDay = calculateCigarettesPerDay(pm25);
  const formattedCount = cigarettesPerDay.toFixed(1);
  const unit = cigarettesPerDay === 1 ? 'cigarette' : 'cigarettes';

  let healthMeaning =
    'Very low particulate load—breathing outdoor air all day carries minimal smoke-equivalent risk for healthy lungs.';

  if (cigarettesPerDay >= 6) {
    healthMeaning =
      'Severe smoke-equivalent exposure—stay indoors with windows sealed and wear a tight-fitting N95/N99 mask for any outdoor step.';
  } else if (cigarettesPerDay >= 3) {
    healthMeaning =
      'Heavy fine-particle load—full-day unfiltered exposure strains lungs and heart health much like smoking several cigarettes daily.';
  } else if (cigarettesPerDay >= 1.5) {
    healthMeaning =
      'Noticeable fine soot in the air—spending the full day outdoors without protection resembles regular secondhand smoke exposure.';
  } else if (cigarettesPerDay >= 0.5) {
    healthMeaning =
      'Light smoke-equivalent exposure over 24 hours; children, seniors, and asthma patients should avoid heavy roadside traffic.';
  }

  return {
    cigarettesPerDay,
    formattedCount,
    headline: `Today’s air = ${formattedCount} ${unit}`,
    healthMeaning,
  };
}

export type AqiTrendDirection = 'improving' | 'worsening' | 'steady';

export interface AqiTrendInfo {
  direction: AqiTrendDirection;
  delta: number;
  previousAqi: number;
  label: string;
  accessibleLabel: string;
}

/**
 * Compares the current AQI reading against the previous hour in today's hourly
 * forecast. Differences within ±3 AQI points are treated as steady.
 */
export function computeAqiTrend(
  currentAqi: number,
  currentTime: string,
  hourly: HourlyPoint[]
): AqiTrendInfo | null {
  if (!Number.isFinite(currentAqi) || !hourly.length) {
    return null;
  }

  let currentHour: number | null = null;
  if (currentTime && currentTime.includes('T')) {
    const parsed = Number.parseInt(currentTime.split('T')[1]?.slice(0, 2) ?? '', 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 23) {
      currentHour = parsed;
    }
  }

  if (currentHour === null) {
    return null;
  }

  const prevHour = currentHour - 1;
  if (prevHour < 0) {
    return null;
  }

  const prevPoint = hourly.find((pt) => pt.hour === prevHour);
  if (!prevPoint || !Number.isFinite(prevPoint.usAqi)) {
    return null;
  }

  const delta = Math.round(currentAqi) - Math.round(prevPoint.usAqi);

  if (delta >= 4) {
    return {
      direction: 'worsening',
      delta,
      previousAqi: prevPoint.usAqi,
      label: `+${delta} vs prev hr · Worsening`,
      accessibleLabel: `Up ${delta} AQI points compared to previous hour (${prevPoint.usAqi}), air quality worsening`,
    };
  }

  if (delta <= -4) {
    return {
      direction: 'improving',
      delta,
      previousAqi: prevPoint.usAqi,
      label: `${delta} vs prev hr · Improving`,
      accessibleLabel: `Down ${Math.abs(delta)} AQI points compared to previous hour (${prevPoint.usAqi}), air quality improving`,
    };
  }

  const signed = delta > 0 ? `+${delta}` : `${delta}`;
  return {
    direction: 'steady',
    delta,
    previousAqi: prevPoint.usAqi,
    label: `${signed} vs prev hr · Steady`,
    accessibleLabel: `Steady compared to previous hour (${prevPoint.usAqi}), change of ${signed} AQI points`,
  };
}

import { describe, expect, it } from 'vitest';
import {
  formatCoordinatesSubtitle,
  formatPlaceDisambiguation,
  INDIAN_CITIES,
  INDOOR_HACK_ITEMS,
  LOW_EMISSION_ITEMS,
} from '../data/cities';
import {
  AQI_BANDS,
  calculateCigarettesPerDay,
  computeAqiTrend,
  filterIndianCities,
  findBestAndWorstWindows,
  formatHourLabel,
  formatHourlyForecastForPrompt,
  getAqiBand,
  getAqiScalePercent,
  getCigaretteEquivalentInfo,
  parseOpenMeteoResponse,
  summarizeThreeDayForecast,
  type HourlyPoint,
} from './aqi';
import {
  buildHindiPlanSpeechText,
  DEFAULT_FAMILY_PROFILE,
  parseAgesList,
  validateFamilyProfile,
  type PersonalizedFamilyPlan,
} from './familyPlan';

describe('AQI category and colour mapping', () => {
  it('classifies all six US AQI bands with expected categories and colours', () => {
    expect(getAqiBand(25)).toMatchObject({ key: 'good', label: 'Good', colorHex: '#15803D' });
    expect(getAqiBand(50)).toMatchObject({ key: 'good', label: 'Good' });
    expect(getAqiBand(51)).toMatchObject({ key: 'moderate', label: 'Moderate', colorHex: '#8F5405' });
    expect(getAqiBand(100)).toMatchObject({ key: 'moderate', label: 'Moderate' });
    expect(getAqiBand(101)).toMatchObject({
      key: 'sensitive',
      label: 'Unhealthy for Sensitive',
      colorHex: '#C2410C',
    });
    expect(getAqiBand(151)).toMatchObject({ key: 'unhealthy', label: 'Unhealthy', colorHex: '#B91C1C' });
    expect(getAqiBand(245)).toMatchObject({
      key: 'very-unhealthy',
      label: 'Very Unhealthy',
      colorHex: '#7E22CE',
    });
    expect(getAqiBand(380)).toMatchObject({ key: 'hazardous', label: 'Hazardous', colorHex: '#881337' });
  });

  it('handles edge cases: AQI 0, negative, NaN, and AQI above 500', () => {
    expect(getAqiBand(0)).toMatchObject({ key: 'good', label: 'Good' });
    expect(getAqiBand(-12)).toMatchObject({ key: 'good', label: 'Good' });
    expect(getAqiBand(Number.NaN)).toMatchObject({ key: 'good', label: 'Good' });
    expect(getAqiBand(501)).toMatchObject({ key: 'hazardous', label: 'Hazardous' });
    expect(getAqiBand(825)).toMatchObject({ key: 'hazardous', label: 'Hazardous' });

    expect(getAqiScalePercent(0)).toBe(1);
    expect(getAqiScalePercent(228)).toBeGreaterThan(66.7);
    expect(getAqiScalePercent(228)).toBeLessThan(83.3);
    expect(getAqiScalePercent(650)).toBe(99);
  });
});

describe('Cigarette equivalence calculation (PM2.5 ÷ 22)', () => {
  it('calculates rounded 1-decimal cigarette count and health guidance', () => {
    expect(calculateCigarettesPerDay(22)).toBe(1);
    expect(calculateCigarettesPerDay(72.9)).toBe(3.3);
    expect(calculateCigarettesPerDay(11)).toBe(0.5);
    expect(calculateCigarettesPerDay(220)).toBe(10);

    expect(getCigaretteEquivalentInfo(22).headline).toBe('Today’s air = 1.0 cigarette');
    const heavy = getCigaretteEquivalentInfo(72.9);
    expect(heavy.headline).toBe('Today’s air = 3.3 cigarettes');
    expect(heavy.healthMeaning).toContain('several cigarettes');
  });

  it('handles zero, negative, and NaN PM2.5 edge cases safely', () => {
    expect(calculateCigarettesPerDay(0)).toBe(0);
    expect(calculateCigarettesPerDay(-5)).toBe(0);
    expect(calculateCigarettesPerDay(Number.NaN)).toBe(0);
    expect(getCigaretteEquivalentInfo(0).headline).toBe('Today’s air = 0.0 cigarettes');
  });
});

describe('Cleanest-hours detection', () => {
  it('picks cleanest 3-hour daytime window (6 AM–9 PM) and worst peak window', () => {
    const hourly: HourlyPoint[] = Array.from({ length: 24 }, (_, hour) => {
      let usAqi = 140;
      if (hour >= 13 && hour <= 15) usAqi = 70;
      if (hour >= 20 && hour <= 22) usAqi = 240;
      if (hour <= 4) usAqi = 55; // Overnight dip must not beat practical daytime hours
      return {
        time: `2026-11-22T${String(hour).padStart(2, '0')}:00`,
        dateKey: '2026-11-22',
        hour,
        usAqi,
        pm25: Math.round(usAqi * 0.45),
      };
    });

    const { best, worst } = findBestAndWorstWindows(hourly, 3);
    expect(best).toMatchObject({
      startHour: 13,
      endHour: 16,
      avgAqi: 70,
      rangeLabel: '1 PM – 4 PM',
    });
    expect(worst).toMatchObject({
      startHour: 20,
      endHour: 23,
      avgAqi: 240,
    });
  });

  it('handles empty and short hourly arrays safely', () => {
    expect(findBestAndWorstWindows([])).toEqual({ best: null, worst: null });

    const shortDay: HourlyPoint[] = [
      { time: '2026-11-22T10:00', dateKey: '2026-11-22', hour: 10, usAqi: 90, pm25: 30 },
      { time: '2026-11-22T11:00', dateKey: '2026-11-22', hour: 11, usAqi: 100, pm25: 35 },
    ];
    const res = findBestAndWorstWindows(shortDay, 3);
    expect(res.best?.avgAqi).toBe(95);
    expect(res.worst?.avgAqi).toBe(95);
  });
});

describe('Trend vs previous hour (computeAqiTrend)', () => {
  const hourly: HourlyPoint[] = [
    { time: '2026-11-22T09:00', dateKey: '2026-11-22', hour: 9, usAqi: 150, pm25: 55 },
    { time: '2026-11-22T10:00', dateKey: '2026-11-22', hour: 10, usAqi: 162, pm25: 60 },
    { time: '2026-11-22T11:00', dateKey: '2026-11-22', hour: 11, usAqi: 152, pm25: 56 },
    { time: '2026-11-22T12:00', dateKey: '2026-11-22', hour: 12, usAqi: 154, pm25: 57 },
  ];

  it('detects worsening, improving, and steady trends compared to previous hour', () => {
    const worsening = computeAqiTrend(162, '2026-11-22T10:00', hourly);
    expect(worsening).toMatchObject({
      direction: 'worsening',
      delta: 12,
      previousAqi: 150,
      label: '+12 vs prev hr · Worsening',
    });

    const improving = computeAqiTrend(152, '2026-11-22T11:00', hourly);
    expect(improving).toMatchObject({
      direction: 'improving',
      delta: -10,
      previousAqi: 162,
      label: '-10 vs prev hr · Improving',
    });

    const steady = computeAqiTrend(154, '2026-11-22T12:00', hourly);
    expect(steady).toMatchObject({
      direction: 'steady',
      delta: 2,
      previousAqi: 152,
      label: '+2 vs prev hr · Steady',
    });
  });

  it('returns null when previous hour is unavailable, at midnight, or hourly data is empty', () => {
    expect(computeAqiTrend(120, '2026-11-22T00:00', hourly)).toBeNull();
    expect(computeAqiTrend(120, '2026-11-22T15:00', hourly)).toBeNull();
    expect(computeAqiTrend(120, 'invalid', hourly)).toBeNull();
    expect(computeAqiTrend(120, '2026-11-22T10:00', [])).toBeNull();
  });
});

describe('Open-Meteo Air Quality response parsing', () => {
  it('parses current readings and 3-day hourly summaries accurately', () => {
    const delhi = INDIAN_CITIES[0];
    const parsed = parseOpenMeteoResponse(
      {
        timezone: 'Asia/Kolkata',
        current: {
          time: '2026-11-22T10:00',
          us_aqi: 184.4,
          pm2_5: 112.34,
          pm10: 198.78,
        },
        hourly: {
          time: [
            '2026-11-22T10:00',
            '2026-11-22T11:00',
            '2026-11-23T10:00',
            '2026-11-24T10:00',
          ],
          us_aqi: [184, 160, 140, 120],
          pm2_5: [112, 95, 80, 62],
        },
      },
      delhi
    );

    expect(parsed.current.usAqi).toBe(184);
    expect(parsed.current.pm25).toBe(112.3);
    expect(parsed.current.pm10).toBe(198.8);
    expect(parsed.days).toHaveLength(3);
    expect(parsed.days[0]).toMatchObject({ label: 'Today', minAqi: 160, maxAqi: 184 });
    expect(parsed.days[1].label).toBe('Tomorrow');
  });

  it('handles missing data, null values, AQI 0, and AQI above 500', () => {
    const delhi = INDIAN_CITIES[0];

    const emptyParsed = parseOpenMeteoResponse({}, delhi);
    expect(emptyParsed.current.usAqi).toBe(0);
    expect(emptyParsed.current.pm25).toBe(0);
    expect(emptyParsed.current.pm10).toBe(0);
    expect(emptyParsed.days).toHaveLength(0);

    const extremeParsed = parseOpenMeteoResponse(
      {
        current: {
          time: '2026-11-22T10:00',
          us_aqi: 612,
          pm2_5: 320,
          pm10: null,
        },
        hourly: {
          time: ['2026-11-22T09:00', '2026-11-22T10:00', 'bad-timestamp'],
          us_aqi: [null, 612, 100],
          pm2_5: [null, 320, 50],
        },
      },
      delhi
    );

    expect(extremeParsed.current.usAqi).toBe(612);
    expect(getAqiBand(extremeParsed.current.usAqi).key).toBe('hazardous');
    expect(extremeParsed.current.pm10).toBe(512); // fallback 1.6x PM2.5
    expect(extremeParsed.days[0].hourly).toHaveLength(1);
  });
});

describe('Supporting utilities, checklists, and family profile helpers', () => {
  it('formats 12-hour labels, 3-day caps, and prompt forecasts', () => {
    expect(formatHourLabel(0)).toBe('12 AM');
    expect(formatHourLabel(12)).toBe('12 PM');
    expect(formatHourLabel(18)).toBe('6 PM');

    const summary = summarizeThreeDayForecast([
      { time: '2026-11-22T09:00', dateKey: '2026-11-22', hour: 9, usAqi: 100, pm25: 40 },
      { time: '2026-11-23T09:00', dateKey: '2026-11-23', hour: 9, usAqi: 110, pm25: 44 },
      { time: '2026-11-24T09:00', dateKey: '2026-11-24', hour: 9, usAqi: 90, pm25: 35 },
      { time: '2026-11-25T09:00', dateKey: '2026-11-25', hour: 9, usAqi: 80, pm25: 30 },
    ]);
    expect(summary).toHaveLength(3);
    const prompt = formatHourlyForecastForPrompt(summary);
    expect(prompt).toContain('Today');
    expect(prompt).toContain('Tomorrow');
    expect(prompt).toContain('Cleanest:');
  });

  it('matches Hindi/English/aliases and formats City, District, State', () => {
    expect(filterIndianCities(INDIAN_CITIES, 'झाँसी')[0]?.id).toBe('jhansi');
    expect(filterIndianCities(INDIAN_CITIES, 'Gurgaon')[0]?.id).toBe('gurugram');
    expect(
      formatPlaceDisambiguation({ name: 'Rampur', district: 'Shimla', state: 'Himachal Pradesh' })
    ).toBe('Rampur, Shimla, Himachal Pradesh');
    expect(formatCoordinatesSubtitle(26.9124, 75.7873)).toBe('26.91° N, 75.79° E');
  });

  it('validates family profile, Hindi TTS summary fallback, and Why this helps copy', () => {
    expect(validateFamilyProfile(DEFAULT_FAMILY_PROFILE).valid).toBe(true);
    expect(validateFamilyProfile({ ...DEFAULT_FAMILY_PROFILE, ages: ' ' }).valid).toBe(false);
    expect(validateFamilyProfile({ ...DEFAULT_FAMILY_PROFILE, memberCount: 0 }).valid).toBe(false);
    expect(parseAgesList('5, 34 67')).toEqual([5, 34, 67]);

    for (const item of [...LOW_EMISSION_ITEMS, ...INDOOR_HACK_ITEMS]) {
      expect(item.whyThisHelps.trim().length).toBeGreaterThanOrEqual(15);
    }
    for (const band of AQI_BANDS) {
      expect(band.maskWhyHelps.trim().length).toBeGreaterThanOrEqual(15);
      expect(band.exerciseWhyHelps.trim().length).toBeGreaterThanOrEqual(15);
    }

    const samplePlan: PersonalizedFamilyPlan = {
      cityName: 'Jhansi',
      cityHindiName: 'झाँसी',
      aqiAtGeneration: 136,
      generatedAt: '2026-11-22T10:00:00Z',
      headline: 'Plan headline',
      householdRiskLevel: 'Moderate',
      householdWhyThisHelps: 'Reduces PM2.5 exposure',
      hindiAudioSummary: 'नमस्ते, आज झाँसी में एक्यूआई 136 है।',
      memberPlans: [
        {
          memberLabel: 'Child (Age 8)',
          riskTag: 'Developing lungs',
          bestHours: {
            recommendedWindow: '12 PM – 3 PM',
            avoidWindow: '6 AM – 9 AM',
            guidance: 'Play indoors',
            whyThisHelps: 'Avoids morning smog',
          },
          lowEmissionRoutine: {
            title: 'School bus',
            detail: 'Share bus',
            whyThisHelps: 'Cuts exhaust',
          },
          indoorAirHack: {
            title: 'Wet mop',
            detail: 'Damp mop floors',
            whyThisHelps: 'Traps dust',
          },
          maskAndExercise: {
            maskType: 'Kid KN95',
            maskWhen: 'Outside',
            exerciseGuidance: 'Indoor games',
            whyThisHelps: 'Protects lungs',
          },
        },
      ],
    };

    expect(buildHindiPlanSpeechText(samplePlan)).toBe(samplePlan.hindiAudioSummary);
    const fallback = buildHindiPlanSpeechText({ ...samplePlan, hindiAudioSummary: '' });
    expect(fallback).toContain('झाँसी');
    expect(fallback).toContain('136');
  });
});

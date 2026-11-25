export type CommuteType =
  | 'metro-bus'
  | 'two-wheeler'
  | 'car'
  | 'auto-erickshaw'
  | 'walk-cycle'
  | 'work-from-home';

export type HomeType =
  | 'high-rise-apartment'
  | 'independent-house'
  | 'road-facing-flat'
  | 'builder-floor'
  | 'pg-hostel';

export interface FamilyProfile {
  memberCount: number;
  ages: string;
  hasKids: boolean;
  hasElderly: boolean;
  breathingIssues: string[];
  breathingNotes: string;
  commuteType: CommuteType;
  homeType: HomeType;
}

export interface MemberActionSuggestion {
  action: string;
  timing?: string;
  whyThisHelps: string;
}

export interface MemberDailyPlan {
  memberLabel: string;
  riskTag: string;
  bestHours: {
    recommendedWindow: string;
    avoidWindow: string;
    guidance: string;
    whyThisHelps: string;
  };
  lowEmissionRoutine: {
    title: string;
    detail: string;
    whyThisHelps: string;
  };
  indoorAirHack: {
    title: string;
    detail: string;
    whyThisHelps: string;
  };
  maskAndExercise: {
    maskType: string;
    maskWhen: string;
    exerciseGuidance: string;
    whyThisHelps: string;
  };
}

export interface PersonalizedFamilyPlan {
  cityName: string;
  cityHindiName: string;
  aqiAtGeneration: number;
  generatedAt: string;
  headline: string;
  householdRiskLevel: string;
  householdWhyThisHelps: string;
  hindiAudioSummary?: string;
  memberPlans: MemberDailyPlan[];
}

export const COMMUTE_OPTIONS: { value: CommuteType; label: string }[] = [
  { value: 'metro-bus', label: 'Metro / City Bus' },
  { value: 'two-wheeler', label: 'Two-Wheeler / Scooter' },
  { value: 'car', label: 'Private Car / Cab' },
  { value: 'auto-erickshaw', label: 'Auto / E-Rickshaw' },
  { value: 'walk-cycle', label: 'Walk / Cycle' },
  { value: 'work-from-home', label: 'Mostly Work From Home' },
];

export const HOME_TYPE_OPTIONS: { value: HomeType; label: string }[] = [
  { value: 'high-rise-apartment', label: 'High-Rise Apartment' },
  { value: 'independent-house', label: 'Independent House / Ground Floor' },
  { value: 'road-facing-flat', label: 'Main-Road Facing Flat' },
  { value: 'builder-floor', label: 'Builder Floor / Colony Flat' },
  { value: 'pg-hostel', label: 'Single Room / PG / Hostel' },
];

export const BREATHING_ISSUE_OPTIONS = [
  'Asthma',
  'Allergic Rhinitis / Sinus',
  'COPD / Chronic Bronchitis',
  'Dust / Smoke Sensitivity',
  'Heart or Blood Pressure Condition',
] as const;

export const DEFAULT_FAMILY_PROFILE: FamilyProfile = {
  memberCount: 4,
  ages: '8, 36, 39, 68',
  hasKids: true,
  hasElderly: true,
  breathingIssues: ['Asthma'],
  breathingNotes: '',
  commuteType: 'metro-bus',
  homeType: 'high-rise-apartment',
};

export interface FamilyValidationResult {
  valid: boolean;
  errors: Partial<Record<'memberCount' | 'ages', string>>;
  parsedAges: number[];
}

export function parseAgesList(agesText: string): number[] {
  return agesText
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((num) => Number.isFinite(num) && Number.isInteger(num) && num >= 0 && num <= 115);
}

export function validateFamilyProfile(profile: FamilyProfile): FamilyValidationResult {
  const errors: Partial<Record<'memberCount' | 'ages', string>> = {};

  if (!Number.isInteger(profile.memberCount) || profile.memberCount < 1 || profile.memberCount > 15) {
    errors.memberCount = 'Enter between 1 and 15 household members.';
  }

  const trimmedAges = profile.ages.trim();
  const parsedAges = parseAgesList(trimmedAges);

  if (!trimmedAges) {
    errors.ages = 'Enter ages for your family members (for example: 8, 36, 39, 68).';
  } else if (parsedAges.length === 0) {
    errors.ages = 'Please enter valid whole-number ages separated by commas.';
  } else if (parsedAges.length > 15) {
    errors.ages = 'List at most 15 ages.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    parsedAges,
  };
}

export function getCommuteLabel(value: CommuteType): string {
  return COMMUTE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getHomeTypeLabel(value: HomeType): string {
  return HOME_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function buildHindiPlanSpeechText(plan: PersonalizedFamilyPlan): string {
  if (plan.hindiAudioSummary && plan.hindiAudioSummary.trim().length > 10) {
    return plan.hindiAudioSummary.trim();
  }

  const cityLabel = plan.cityHindiName || plan.cityName;
  const parts: string[] = [
    `साफ़ हवा परिवार योजना। आज ${cityLabel} का एक्यूआई ${plan.aqiAtGeneration} है।`,
  ];

  for (const member of plan.memberPlans) {
    parts.push(
      `${member.memberLabel} के लिए बाहर जाने का सबसे बेहतर समय ${member.bestHours.recommendedWindow} है, और ${member.bestHours.avoidWindow} के बीच बाहर जाने से बचें। मास्क सलाह: ${member.maskAndExercise.maskType}।`
    );
  }

  return parts.join(' ');
}

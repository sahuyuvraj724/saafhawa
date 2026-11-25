import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { QUICK_PICK_CITIES } from '../../data/cities';
import type { LiveAirQualityData } from '../../utils/aqi';
import {
  DEFAULT_FAMILY_PROFILE,
  type FamilyProfile,
  type PersonalizedFamilyPlan,
} from '../../utils/familyPlan';
import { FamilyPlanSection } from '../FamilyPlanSection';

const MOCK_AIR_QUALITY: LiveAirQualityData = {
  city: QUICK_PICK_CITIES[0],
  fetchedAt: '2026-11-22T10:00:00Z',
  timezone: 'Asia/Kolkata',
  current: {
    time: '2026-11-22T10:00',
    usAqi: 185,
    pm25: 76.5,
    pm10: 112.4,
  },
  days: [
    {
      dateKey: '2026-11-22',
      label: 'Today',
      shortDate: '22 Nov',
      minAqi: 130,
      maxAqi: 210,
      avgAqi: 170,
      hourly: [
        { time: '2026-11-22T08:00', dateKey: '2026-11-22', hour: 8, usAqi: 210, pm25: 88 },
        { time: '2026-11-22T13:00', dateKey: '2026-11-22', hour: 13, usAqi: 130, pm25: 48 },
      ],
    },
  ],
};

const MOCK_PLAN: PersonalizedFamilyPlan = {
  cityName: 'Delhi',
  cityHindiName: 'दिल्ली',
  aqiAtGeneration: 185,
  generatedAt: '2026-11-22T10:05:00Z',
  headline: 'Keep mornings indoors and mask up for Delhi commutes',
  householdRiskLevel: 'High care for child and senior',
  householdWhyThisHelps: 'Staggering outdoor windows cuts daily PM2.5 inhalation across vulnerable ages.',
  hindiAudioSummary: 'नमस्ते, आज दिल्ली में हवा का स्तर 185 है। दोपहर 1 से 4 बजे के बीच बाहर जाएं।',
  memberPlans: [
    {
      memberLabel: 'Child (Age 8)',
      riskTag: 'Developing lungs',
      bestHours: {
        recommendedWindow: '1 PM – 4 PM',
        avoidWindow: '6 AM – 9 AM',
        guidance: 'Keep morning play indoors and use school bus with windows shut.',
        whyThisHelps: 'Protects developing airways from morning smog inversion.',
      },
      lowEmissionRoutine: {
        title: 'Shared school bus',
        detail: 'Take the neighborhood school bus instead of a private car drop-off.',
        whyThisHelps: 'Avoids cold-start tailpipe fumes outside school gates.',
      },
      indoorAirHack: {
        title: 'Wet mop play area',
        detail: 'Damp mop the floor before evening homework.',
        whyThisHelps: 'Traps settled dust instead of kicking it into breathing height.',
      },
      maskAndExercise: {
        maskType: 'Kid-sized KN95',
        maskWhen: 'Whenever outdoors',
        exerciseGuidance: 'Move evening play indoors.',
        whyThisHelps: 'Filters over 95% of fine PM2.5 during outdoor transit.',
      },
    },
    {
      memberLabel: 'Senior (Age 68)',
      riskTag: 'Asthma care',
      bestHours: {
        recommendedWindow: '2 PM – 4 PM',
        avoidWindow: '7 PM – 10 PM',
        guidance: 'Take a brief indoor hallway walk instead of morning park walks.',
        whyThisHelps: 'Prevents cold-air and PM2.5 asthma triggers.',
      },
      lowEmissionRoutine: {
        title: 'Combine pharmacy errands',
        detail: 'Group medicines and groceries into one mid-afternoon delivery.',
        whyThisHelps: 'Cuts two-wheeler trips during peak congestion.',
      },
      indoorAirHack: {
        title: 'Seal bedroom before dusk',
        detail: 'Close balcony doors by 5 PM and run HEPA purifier.',
        whyThisHelps: 'Provides 8 hours of low-PM sleep recovery overnight.',
      },
      maskAndExercise: {
        maskType: 'Sealed N95',
        maskWhen: 'Any outdoor step',
        exerciseGuidance: 'Gentle indoor stretching and pranayama in filtered room.',
        whyThisHelps: 'Maintains mobility without inhaling heavy evening soot.',
      },
    },
  ],
};

function FamilyPlanHarness({ initialPlan = null }: { initialPlan?: PersonalizedFamilyPlan | null }) {
  const [profile, setProfile] = useState<FamilyProfile>(DEFAULT_FAMILY_PROFILE);
  const [plan, setPlan] = useState<PersonalizedFamilyPlan | null>(initialPlan);

  return (
    <FamilyPlanSection
      city={QUICK_PICK_CITIES[0]}
      airQuality={MOCK_AIR_QUALITY}
      bestWindow={{
        startHour: 13,
        endHour: 16,
        avgAqi: 130,
        avgPm25: 48,
        rangeLabel: '1 PM – 4 PM',
      }}
      worstWindow={{
        startHour: 6,
        endHour: 9,
        avgAqi: 210,
        avgPm25: 88,
        rangeLabel: '6 AM – 9 AM',
      }}
      profile={profile}
      onChangeProfile={setProfile}
      plan={plan}
      onPlanGenerated={setPlan}
    />
  );
}

describe('FamilyPlanSection — My Family form and plan display', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('validates inputs, submits profile to mocked Gemini API, and renders per-member cards with Why this helps', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ plan: MOCK_PLAN }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<FamilyPlanHarness />);

    // Verify form fields have proper accessible labels
    const agesInput = screen.getByLabelText(/Ages of members/i);
    expect(screen.getByLabelText(/Number of people/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Primary commute type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Home type/i)).toBeInTheDocument();

    // Validation check: empty ages blocks submission and shows alert
    await user.clear(agesInput);
    await user.click(screen.getByRole('button', { name: /Generate Family Plan/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter ages for your family members/i);
    expect(fetchMock).not.toHaveBeenCalled();

    // Enter valid ages and submit
    await user.type(agesInput, '8, 68');
    await user.click(screen.getByRole('button', { name: /Generate Family Plan/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ai-family-plan-cards')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/family-plan');

    // Family plan display: heading order (h3 headline -> h4 member cards) and Why this helps
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Keep mornings indoors and mask up for Delhi commutes/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Child (Age 8)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Senior (Age 68)' })).toBeInTheDocument();
    expect(screen.getAllByText(/Why this helps:/i).length).toBeGreaterThanOrEqual(8);
  });

  it('shows a friendly error alert when /api/family-plan fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Gemini is temporarily busy.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    render(<FamilyPlanHarness />);
    await user.click(screen.getByRole('button', { name: /Generate Family Plan/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Gemini is temporarily busy/i);
    });
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('supports Listen in Hindi (hi-IN) and Stop controls on the family plan display', async () => {
    const user = userEvent.setup();
    const speakMock = vi.fn((utterance: SpeechSynthesisUtterance) => {
      utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
    });
    const cancelMock = vi.fn();

    class MockUtterance {
      text: string;
      lang = '';
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: ((e: SpeechSynthesisEvent) => void) | null = null;
      onend: ((e: SpeechSynthesisEvent) => void) | null = null;
      onerror: ((e: SpeechSynthesisErrorEvent) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak: speakMock,
        cancel: cancelMock,
        getVoices: () => [{ lang: 'hi-IN', name: 'Google हिन्दी' }],
      },
    });

    render(<FamilyPlanHarness initialPlan={MOCK_PLAN} />);

    const listenBtn = screen.getByRole('button', { name: /Listen in Hindi/i });
    const stopBtn = screen.getByRole('button', { name: /Stop reading Hindi plan/i });
    expect(stopBtn).toBeDisabled();

    await user.click(listenBtn);
    expect(speakMock).toHaveBeenCalledTimes(1);
    const spoken = speakMock.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(spoken.lang).toBe('hi-IN');
    expect(spoken.text).toContain('दिल्ली');
    expect(stopBtn).toBeEnabled();

    await user.click(stopBtn);
    expect(cancelMock).toHaveBeenCalled();
    expect(stopBtn).toBeDisabled();
  });
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  INDIAN_CITIES,
  INDOOR_HACK_ITEMS,
  LOW_EMISSION_ITEMS,
  type IndianCity,
} from './data/cities';
import { fetchLiveAirQuality } from './services/openMeteo';
import { findBestAndWorstWindows, type LiveAirQualityData } from './utils/aqi';
import {
  DEFAULT_FAMILY_PROFILE,
  type FamilyProfile,
  type PersonalizedFamilyPlan,
} from './utils/familyPlan';
import { Header } from './components/Header';
import { CitySearch } from './components/CitySearch';
import { LiveAqiHero } from './components/LiveAqiHero';
import { BestHoursSection } from './components/BestHoursSection';
import { FamilyPlanSection } from './components/FamilyPlanSection';
import { ChecklistSection } from './components/ChecklistSection';
import { MaskExerciseSection } from './components/MaskExerciseSection';

const STORAGE_KEYS = {
  city: 'saafhawa:selected-city:v1',
  lastSearchedCity: 'saafhawa:last-searched-city:v1',
  lowEmission: 'saafhawa:low-emission-checked:v1',
  indoorHacks: 'saafhawa:indoor-hacks-checked:v1',
  familyProfile: 'saafhawa:family-profile:v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [selectedCity, setSelectedCity] = useState<IndianCity>(() =>
    readStorage<IndianCity>(STORAGE_KEYS.city, INDIAN_CITIES[0])
  );
  const [lastSearchedCity, setLastSearchedCity] = useState<IndianCity | null>(() =>
    readStorage<IndianCity | null>(STORAGE_KEYS.lastSearchedCity, null)
  );
  const [airQuality, setAirQuality] = useState<LiveAirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const [lowEmissionChecked, setLowEmissionChecked] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.lowEmission, [])
  );
  const [indoorHacksChecked, setIndoorHacksChecked] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.indoorHacks, [])
  );
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile>(() =>
    readStorage<FamilyProfile>(STORAGE_KEYS.familyProfile, DEFAULT_FAMILY_PROFILE)
  );
  const [aiFamilyPlan, setAiFamilyPlan] = useState<PersonalizedFamilyPlan | null>(null);

  const loadCityAirQuality = useCallback(async (city: IndianCity, signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const liveData = await fetchLiveAirQuality(city, signal);
      setAirQuality(liveData);
      setSelectedDayIndex(0);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(
        err instanceof Error
          ? err.message
          : 'Network issue while contacting Open-Meteo.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCityAirQuality(selectedCity, controller.signal);
    return () => controller.abort();
  }, [selectedCity, loadCityAirQuality]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.city, JSON.stringify(selectedCity));
    } catch {
      // Ignore storage quota issues
    }
  }, [selectedCity]);

  useEffect(() => {
    if (!lastSearchedCity) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.lastSearchedCity,
        JSON.stringify(lastSearchedCity)
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [lastSearchedCity]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.lowEmission,
        JSON.stringify(lowEmissionChecked)
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [lowEmissionChecked]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.indoorHacks,
        JSON.stringify(indoorHacksChecked)
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [indoorHacksChecked]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.familyProfile,
        JSON.stringify(familyProfile)
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [familyProfile]);

  const todayHourly = airQuality?.days[0]?.hourly ?? [];
  const { best: todayBestWindow, worst: todayWorstWindow } = useMemo(
    () => findBestAndWorstWindows(todayHourly, 3),
    [todayHourly]
  );

  const indoorDynamicHints = useMemo(() => {
    const hints: Record<string, string> = {};
    if (todayBestWindow) {
      hints['ventilation-timing'] =
        todayBestWindow.avgAqi > 150
          ? `Even today’s lowest slot in ${selectedCity.name} (${todayBestWindow.rangeLabel}, Avg AQI ${todayBestWindow.avgAqi}) is elevated—limit cross-ventilation to 5 minutes only if stuffy, or rely on air filtration.`
          : `Best window today in ${selectedCity.name}: ${todayBestWindow.rangeLabel} (Avg AQI ${todayBestWindow.avgAqi}). Cross-ventilate for 15–20 minutes.`;
    }
    if (todayWorstWindow) {
      hints['shut-windows'] = `Peak haze window today: ${todayWorstWindow.rangeLabel} (Avg AQI ${todayWorstWindow.avgAqi}). Close exterior windows and balcony gaps beforehand.`;
    }
    return hints;
  }, [selectedCity.name, todayBestWindow, todayWorstWindow]);

  const toggleItem = (
    itemId: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F6] text-[#111C18]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-[#0F5E4A] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to content
      </a>

      <Header
        onRefresh={() => loadCityAirQuality(selectedCity)}
        isLoading={isLoading}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10 focus:outline-none"
      >
        {/* Section 1: City Search + Live AQI */}
        <section id="live-aqi" aria-label="Live city air quality" className="space-y-6">
          <CitySearch
            selectedCity={selectedCity}
            lastSearchedCity={lastSearchedCity}
            onSelectCity={(city, source) => {
              setSelectedCity(city);
              if (source === 'search') {
                setLastSearchedCity(city);
              }
            }}
          />

          <LiveAqiHero
            city={selectedCity}
            data={airQuality}
            isLoading={isLoading}
            error={error}
            onRetry={() => loadCityAirQuality(selectedCity)}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
          />
        </section>

        {/* Section 2: Best Hours to Go Out Today */}
        {airQuality && airQuality.days.length > 0 && (
          <BestHoursSection
            cityName={selectedCity.name}
            cityHindiName={selectedCity.hindiName}
            days={airQuality.days}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
          />
        )}

        {/* Personalized AI Section: My Family Form + Gemini Daily Plan Cards */}
        <FamilyPlanSection
          city={selectedCity}
          airQuality={airQuality}
          bestWindow={todayBestWindow}
          worstWindow={todayWorstWindow}
          profile={familyProfile}
          onChangeProfile={setFamilyProfile}
          plan={aiFamilyPlan}
          onPlanGenerated={setAiFamilyPlan}
        />

        {/* Sections 3 & 4: Low-Emission Day Planner & Indoor AQI Hacks Checklists */}
        <div
          id="planners"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
        >
          <ChecklistSection
            id="low-emission"
            title="Low-emission day planner"
            subtitle="Practical daily habits that cut local urban PM2.5 and commuter exhaust."
            items={LOW_EMISSION_ITEMS}
            checkedIds={lowEmissionChecked}
            onToggle={(id) => toggleItem(id, setLowEmissionChecked)}
            onReset={() => setLowEmissionChecked([])}
          />

          <ChecklistSection
            id="indoor-hacks"
            title="Indoor AQI hacks"
            subtitle={`Synced with today’s air quality forecast for ${selectedCity.name}.`}
            items={INDOOR_HACK_ITEMS}
            checkedIds={indoorHacksChecked}
            onToggle={(id) => toggleItem(id, setIndoorHacksChecked)}
            onReset={() => setIndoorHacksChecked([])}
            dynamicHints={indoorDynamicHints}
          />
        </div>

        {/* Section 5: Mask and Outdoor-Exercise Advice */}
        {airQuality && (
          <MaskExerciseSection
            cityName={selectedCity.name}
            cityHindiName={selectedCity.hindiName}
            currentAqi={airQuality.current.usAqi}
            bestWindow={todayBestWindow}
          />
        )}
      </main>

      <footer className="mt-8 border-t border-[#E0E6E3] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4A5B54]">
          <p>
            <strong className="font-semibold text-[#111C18]">SaafHawa</strong> · Urban Air Quality Assistant for Indian Cities
          </p>
          <p>
            Live readings & 3-day forecasts via Open-Meteo Air Quality API (US AQI scale) · Personalized family planning via Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
